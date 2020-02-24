import http from 'http';
import https from 'https';
import assert from 'assert';
import * as WebSocket from 'ws';
import EventEmitter from 'eventemitter3';
import * as ETDataTypes from './ETDataTypes';
export default class ETWebsocket {
	wss: WebSocket.Server;
	eventEmitter?: EventEmitter;
	localWS: { [wsId: string]: WebSocket } = {};
	get dyno(): string {
		return process.env.DYNO ? process.env.DYNO : 'Localhost';
	}
	constructor(server: http.Server | https.Server) {
		this.eventEmitter = new EventEmitter();
		this.wss = new WebSocket.Server({ server, clientTracking: true });
		this.wss.addListener('connection', this._wssOnConnection.bind(this));
	}
	on(eventName: string, listener: any) {
		this.eventEmitter?.on(eventName, listener);
	}
	wsSend(wsDyno: ETDataTypes.IWsDyno, message: ETDataTypes.IMessage) {
		this._wsSend(this.localWS[wsDyno.wsId], message);
	}
	registerWS(ws: WebSocket, wsId: string) {
		// Save websocket
		this._saveWS(ws, wsId);
		console.log(`*** ${this._debugWsId(wsId)}: New Connection`);
		// Register events
		ws.on('open', () => this._wsOnOpen(wsId));
		ws.on('error', (error: Error) => this._wsOnError(error, wsId));
		ws.on('message', (strMessage: string) => this._wsOnMessage(ws, strMessage, wsId));
		ws.on('close', (code: Number, reason: String) => this._wsOnClose(code, reason, wsId));
		// Notify client we have an Id.
		const message: ETDataTypes.IMessage = this._makeTestMessage(ETDataTypes.MessageType.REGISTERED, wsId);
		message.msg = 'REGISTERED';
		this._wsSend(ws, message);
	}
	_wssOnConnection(ws: WebSocket, request: http.IncomingMessage) {
		// Send feedback to the incoming connection
		this._wsSend(ws, this._makeTestMessage(ETDataTypes.MessageType.CONNECTED));
		this.eventEmitter?.emit(ETDataTypes.EventType.registerWS, ws);
	}
	_wsOnOpen(fromWsId: string) {
		console.log(`*** ${this._debugWsId(fromWsId)}: Connection Openned`);
	}
	_wsOnError(error: Error, fromWsId: string) {
		console.log(`*** ${this._debugWsId(fromWsId)}: Error`);
		console.log(error);
	}
	_wsOnMessage(ws: WebSocket, strMessage: string, fromWsId: string) {
		const message: ETDataTypes.IMessage = JSON.parse(strMessage);
		fromWsId = String(fromWsId);
		message.fromDyno = this.dyno;
		message.fromWsId = String(message.fromWsId);
		assert(message.fromWsId === fromWsId);
		this._saveWS(ws, fromWsId);
		if (message.type === ETDataTypes.MessageType.PING) {
			// Pong
			this._wsSend(ws, this._makeTestMessage(ETDataTypes.MessageType.PONG, fromWsId));
		} else {
			this._wsSend(ws, this._makeTestMessage(ETDataTypes.MessageType.ECHO, fromWsId, message));
			this.eventEmitter?.emit(ETDataTypes.EventType.messageIn, message);
		}
	}
	_wsOnClose(code: Number, reason: String, wsId: string) {
		console.log(`*** ${this._debugWsId(wsId)}: Connection Closed [${code}]: ${reason}`);
		delete this.localWS[wsId];
		this.eventEmitter?.emit(ETDataTypes.EventType.deleteWS, wsId);
	}
	_wsSend(ws: WebSocket, message: ETDataTypes.IMessage) {
		ws.send(JSON.stringify(message, null, 1));
		if (message.type === ETDataTypes.MessageType.POST) {
			this.eventEmitter?.emit(ETDataTypes.EventType.messageOut, message);
		}
	}
	_saveWS(ws: WebSocket, wsId: string) {
		this.localWS[wsId] = ws;
		this.eventEmitter?.emit(ETDataTypes.EventType.saveWS, wsId);
	}

	_debugWsId(wsId: string): string {
		return `[${wsId}@${this.dyno}]`;
	}
	_makeTestMessage(type: ETDataTypes.MessageType, wsId?: string, message?: ETDataTypes.IMessage): ETDataTypes.IMessage {
		const output: ETDataTypes.IMessage = {
			type,
			private: true,
			msg: `Test ${type}`,
			echo: message ? message : null,
			dttm: new Date(),
			// FROM
			fromWsId: wsId ? wsId : null,
			fromDyno: this.dyno,
			// TO
			toWsId: wsId ? wsId : null,
			toDyno: this.dyno
		};
		return output;
	}
}
