export enum MessageType {
	CONNECTED = 'CONNECTED',
	REGISTERED = 'REGISTERED',
	ECHO = 'ECHO',
	POST = 'POST',
	PING = 'PING',
	PONG = 'PONG'
}

export enum EventType {
	// When remote dyno found local dyno, we can send message here!
	FoundLocal = 'FoundLocal',
	// When the ws needs to be associated with this dyno.
	saveWS = 'saveWS',
	// When the ws needs to be removed with this dyno.
	deleteWS = 'deleteWS',
	// When a new message arrives from a websocket client
	messageIn = 'messageIn',
	// When a message is sent to a websocket client
	messageOut = 'messageOut',
	// When a new ws connection arrives, we need to register it.
	registerWS = 'registerWS'
}

export interface IWsDyno {
	wsId: string;
	dynoId: string;
}

export interface IMessage {
	type: MessageType;
	private: boolean;
	msg: string;
	echo: IMessage | null;
	dttm: Date;
	// FROM
	fromWsId: string | null;
	fromDyno: string;
	// TO
	toWsId: string | null;
	toDyno: string;
}
