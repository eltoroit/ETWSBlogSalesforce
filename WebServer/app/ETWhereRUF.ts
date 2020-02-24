import http from 'http';
import https from 'https';
import ETRedis from './ETRedis';
import * as WebSocket from 'ws';
import ETWebsocket from './ETWebsocket';
import * as ETDataTypes from './ETDataTypes';

export default class ETWhereRUF {
	etRedis: ETRedis;
	etWebsocket: ETWebsocket;

	get dyno(): string {
		return process.env.DYNO ? process.env.DYNO : 'Localhost';
	}

	constructor(server: http.Server | https.Server) {
		this.etRedis = new ETRedis();
		this.etWebsocket = new ETWebsocket(server);

		this.etRedis.on(ETDataTypes.EventType.FoundLocal, (message: ETDataTypes.IMessage) => {
			console.log(
				`REMOTE-3 (Local dyno notified): Sending message ${message.fromWsId}@${message.fromDyno} => ${message.toWsId}@${message.toDyno}`
			);
			this.postToOne(message);
		});
		this.etWebsocket.on(ETDataTypes.EventType.saveWS, (wsId: string) => this.saveWsDyno(wsId));
		this.etWebsocket.on(ETDataTypes.EventType.deleteWS, (wsId: string) => this.deleteWsDyno(wsId));
		this.etWebsocket.on(ETDataTypes.EventType.messageIn, (message: ETDataTypes.IMessage) => this.messageReceived(message));
		this.etWebsocket.on(ETDataTypes.EventType.messageOut, (message: ETDataTypes.IMessage) => this.messageSent(message));
		this.etWebsocket.on(ETDataTypes.EventType.registerWS, (ws: WebSocket) => this.registerWS(ws));
	}

	saveWsDyno(wsId: string) {
		this.etRedis.saveWsDyno(wsId);
	}

	deleteWsDyno(wsId: string) {
		this.etRedis.deleteWsDyno(wsId);
	}

	registerWS(ws: WebSocket) {
		this.etRedis
			.getNewWsId()
			.then((wsId: string) => {
				this.etWebsocket.registerWS(ws, wsId);
			})
			.catch(err => {
				throw new Error(err);
			});
	}

	messageSent(message: ETDataTypes.IMessage) {
		console.log(`Sent Message: ${JSON.stringify(message)}`);
	}

	messageReceived(message: ETDataTypes.IMessage) {
		console.log(`Received Message: ${JSON.stringify(message)}`);

		switch (message.type) {
			case ETDataTypes.MessageType.POST:
				if (String(message.toWsId) === '-1') {
					message.private = false;
					this.postToAll(message);
				} else {
					message.private = true;
					this.postToOne(message);
				}
				break;
			case ETDataTypes.MessageType.PING:
				// Nothing
				break;
			default:
				break;
		}
	}

	postToAll(message: ETDataTypes.IMessage) {
		this.etRedis
			.getAllWsDynos()
			.then((wsDynos: ETDataTypes.IWsDyno[]) => {
				wsDynos.forEach((wsDyno: ETDataTypes.IWsDyno) => {
					let messageClone: ETDataTypes.IMessage = JSON.parse(JSON.stringify(message));
					messageClone.toWsId = wsDyno.wsId;
					messageClone.toDyno = wsDyno.dynoId;
					this.post(messageClone, wsDyno);
				});
			})
			.catch(err => {
				throw new Error(err);
			});
	}

	postToOne(message: ETDataTypes.IMessage) {
		if (message.toWsId) {
			this.etRedis
				.getOneWsDyno(message.toWsId)
				.then((wsDyno: ETDataTypes.IWsDyno) => {
					message.toDyno = wsDyno.dynoId;
					this.post(message, wsDyno);
				})
				.catch(err => {
					throw new Error(err);
				});
		} else {
			throw new Error("Can't post to the ether!");
		}
	}

	post(message: ETDataTypes.IMessage, wsDyno: ETDataTypes.IWsDyno) {
		if (wsDyno.dynoId === this.dyno) {
			// Message on same dyno
			if (message.fromDyno === message.toDyno) {
				console.log(`LOCAL: Sending message ${message.fromWsId}@${message.fromDyno} => ${message.toWsId}@${message.toDyno}`);
			} else {
				console.log(`REMOTE-4 (As Local): Sending message ${message.fromWsId}@${message.fromDyno} => ${message.toWsId}@${message.toDyno}`);
			}
			this.etWebsocket.wsSend(wsDyno, message);
		} else {
			// Message on different dyno
			console.log(`REMOTE-1 (Find Remote): Sending message ${message.fromWsId}@${message.fromDyno} => ${message.toWsId}@${message.toDyno}`);
			this.etRedis.publishMessage(wsDyno.dynoId, message);
		}
	}
}
