/* eslint-disable no-unused-vars */
/* eslint-disable no-alert */
/* eslint-disable no-console */
import { LightningElement, api } from "lwc";
import Websocket from "c/websocket";
import Streaming from "c/streaming";

export default class Client extends LightningElement {
	private = {
		client: null,
		channel: null,
		messages: [],
		numberClients: null
	};

	msg = "";
	toId = -1;
	title = "";
	received = "";
	isConnected = false;

	@api clientId;

	@api
	get channel() {
		return this.private.channel;
	}
	set channel(value) {
		if (this.private.channel !== value) {
			// Changed
			this.private.channel = value;
			this._initializeClient();
		}
	}

	@api
	get numberClients() {
		return this.private.numberClients;
	}
	set numberClients(value) {
		this.private.numberClients = value;
		this._initializeClient();
	}

	@api
	open() {
		this.private.client.open();
	}

	@api
	close() {
		this._resetClient();
		this.private.client.close();
	}

	connectedCallback() {
		this._initializeClient();
	}

	handleMessageChange(event) {
		this.msg = event.target.value;
	}

	handleToIdChange(event) {
		this.toId = event.target.value;
	}

	handlePublishClick() {
		this.dispatchEvent(new CustomEvent("countposts", { detail: 0 }));
		const msg = this.private.client.buildMessage("POST", this.toId, this.msg);
		this.private.client.publish(msg);
	}

	handleNotifyState(event) {
		let detail = event.detail;
		this.title = this.private.client.title;
		this.isConnected = this.private.client.isConnected;

		detail.clientId = this.clientId;
		this.dispatchEvent(new CustomEvent("notifystate", { detail }));
	}

	handleMessage(event) {
		const data = event.detail;
		this.title = this.private.client.title;

		this.received = `${data.type}: ${data.msg}<br/>`;
		if (data.fromId !== data.toId) {
			this.received += `${data.fromId}@${data.fromDyno} => ${data.toId}@${data.toDyno}.<br/>`;
		}
		this.received += `${data.private ? "Private" : "Public"} @ `;
		this.received += new Date(data.dttm).toLocaleDateString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });

		this.private.messages.unshift({
			key: this.private.messages.length,
			data: data
		});

		if (data.type === "POST") {
			this.dispatchEvent(new CustomEvent("countposts", { detail: +1 }));
		}
	}

	_initializeClient() {
		this._resetClient();
		const isStreaming = this.private.channel.indexOf("wss") !== 0;
		if (isStreaming) {
			this.private.client = new Streaming();
			this.private.client.numberClients = this.numberClients;
		} else {
			this.private.client = new Websocket();
		}
		this.private.client.channel = this.channel;
		this.private.client.clientId = this.clientId;
		this.private.client.on("message", event => {
			this.handleMessage(event);
		});
		this.private.client.on("notifystate", event => {
			this.handleNotifyState(event);
		});
	}

	_resetClient() {
		this.msg = "";
		this.toId = -1;
		this.title = "";
		this.received = "";
		this.isConnected = false;
	}
}
