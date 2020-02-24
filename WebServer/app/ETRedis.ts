import * as redis from 'redis';
import * as ETDataTypes from './ETDataTypes';
import EventEmitter from 'eventemitter3';

export default class ETRedis {
	eventEmitter?: EventEmitter;
	redisData?: redis.RedisClient;
	redisSubscriber?: redis.RedisClient;

	get dyno(): string {
		return process.env.DYNO ? process.env.DYNO : 'Localhost';
	}

	constructor() {
		this.eventEmitter = new EventEmitter();

		// REDIS Data
		this.redisData = this.createRedis();
		this.redisData.on('error', (err: any) => {
			console.error(err);
		});

		// REDIS Inter-Dyno Communication (one channel per dyno or one for localhost)
		this.redisSubscriber = this.createRedis();
		this.redisSubscriber.subscribe(this.dyno);
		this.redisSubscriber.addListener('message', this.receiveMessage.bind(this));
	}
	on(eventName: string, listener: any) {
		// Events:
		// "message"	This dyno needs to handle the message published by another dyno.
		this.eventEmitter?.on(eventName, listener);
	}
	createRedis(): redis.RedisClient {
		return redis.createClient(<string>process.env.REDIS_URL);
	}

	// REDIS Data
	saveWsDyno(wsId: string) {
		// For each Websocket, give me the dyno where it connected.
		// The dyno information must be recent (< 2 minutes) when reading it back
		// WebsocketId:string => { dyno:string, refreshedAt:Date }
		this.redisData?.HSET('WsId_To_DynoId', wsId, JSON.stringify({ dyno: this.dyno, refreshedAt: new Date().toJSON() }));
	}

	deleteWsDyno(wsId: string) {
		this.redisData?.HDEL('WsId_To_DynoId', wsId);
	}

	getOneWsDyno(wsId: string): Promise<ETDataTypes.IWsDyno> {
		return new Promise((resolve, reject) => {
			this.redisData?.HGET('WsId_To_DynoId', wsId, (err, strWsDyno) => {
				if (err) {
					reject(err);
				} else if (strWsDyno) {
					const dynoId = this.getDyno(wsId, strWsDyno);
					if (dynoId) {
						const wsDyno: ETDataTypes.IWsDyno = { wsId, dynoId };
						resolve(wsDyno);
					} else {
						reject('Value was too old');
					}
				} else {
					reject(`Failed HGET:WsId_To_DynoId:${wsId}`);
				}
			});
		});
	}

	getAllWsDynos(): Promise<ETDataTypes.IWsDyno[]> {
		return new Promise((resolve, reject) => {
			this.redisData?.HGETALL('WsId_To_DynoId', (err, strWsDynos) => {
				if (err) {
					reject(err);
				} else if (strWsDynos) {
					let outputWsDynos: { [name: string]: Array<ETDataTypes.IWsDyno> } = {
						same: [],
						other: []
					};
					Object.keys(strWsDynos).forEach(wsId => {
						const strWsDyno = strWsDynos[wsId];
						const dynoId = this.getDyno(wsId, strWsDyno);
						if (dynoId) {
							const wsDyno: ETDataTypes.IWsDyno = { wsId, dynoId };
							if (dynoId === this.dyno) {
								outputWsDynos.same.push(wsDyno);
							} else {
								outputWsDynos.other.push(wsDyno);
							}
						}
					});
					resolve(outputWsDynos.same.concat(outputWsDynos.other));
				} else {
					reject(`Failed HGETALL:WsId_To_DynoId`);
				}
			});
		});
	}

	getNewWsId(): Promise<string> {
		return new Promise((resolve, reject) => {
			this.redisData?.INCR('wsid', (err, wsId) => {
				if (err) {
					reject(err);
				} else if (wsId) {
					resolve(String(wsId));
				}
			});
		});
	}

	getDyno(wsId: string, strWsDyno: string): string {
		// Redis can EXPIRE the whole hash, but not each key.
		const now = new Date().getTime();
		const jsonWsDyno = JSON.parse(strWsDyno);
		const refreshAt = new Date(jsonWsDyno.refreshedAt).getTime();
		const age = Math.abs(now - refreshAt) / 1000; // Seconds
		const isRecent = age < 120;
		let dyno = undefined;
		if (!isRecent) {
			console.error(`Value was too old: ${strWsDyno}`);
			this.deleteWsDyno(wsId);
		} else {
			dyno = jsonWsDyno.dyno;
		}
		return dyno;
	}

	// REDIS Inter-Dyno Communication (one channel per dyno or one for localhost)
	publishMessage(toDyno: string, message: ETDataTypes.IMessage) {
		// We publish from "redisData" but subcribe in "redisSubscriber". Otherwise Redis will error out
		// ERR only (P)SUBSCRIBE / (P)UNSUBSCRIBE / PING / QUIT allowed in this context
		this.redisData?.PUBLISH(toDyno, JSON.stringify(message));
	}
	receiveMessage(toDyno: string, strMessage: string) {
		const message: ETDataTypes.IMessage = JSON.parse(strMessage);
		console.log(`REMOTE-2 (Remote Found): Sending message ${message.fromWsId}@${message.fromDyno} => ${message.toWsId}@${message.toDyno}`);
		this.eventEmitter?.emit(ETDataTypes.EventType.FoundLocal, message);
	}
}
