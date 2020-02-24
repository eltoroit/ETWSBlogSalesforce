/* eslint-disable no-alert */
/* eslint-disable no-console */
import { subscribe, unsubscribe, onError } from "lightning/empApi";
import publisher from "@salesforce/apex/Publisher.publish";

export default class Streaming {
	_events = {};
	_client = null;
	_oldState = "CLOSED";
	_manualClose = false;
	_isConnected = false;
	_subscription = {};

	channel;
	clientId;
	numberClients;

	get title() {
		return `${this.clientId}`;
	}

	get isConnected() {
		return this._isConnected;
	}

	open() {
		if (!this._isConnected) {
			this._client = null;
			this._manualClose = false;
			this._initialize();
		}
	}

	close() {
		this._manualClose = true;
		if (this._isConnected) {
			this._close();
		}
	}

	publish(message) {
		message.channel = this.channel;
		message.numberClients = this.numberClients;
		console.log(`PUBLISHING: ${JSON.stringify(message)}`);
		publisher(message)
			.then(result => {
				this._notifyState("OPEN", "publish", result);
			})
			.catch(err => {
				alert(`Error: ${JSON.stringify(err)}`);
			});
	}

	buildMessage(type, toId, data) {
		return {
			type,
			fromId: this.clientId,
			toId: toId,
			msg: data ? data : "NO DATA",
			private: "N/A",
			fromDyno: "N/A",
			toDyno: "N/A",
			dttm: new Date()
		};
	}

	// Make this a service component
	on(eventName, callback) {
		this._events[eventName] = callback;
	}
	dispatchEvent(event) {
		if (this._events[event.type]) {
			this._events[event.type]({ detail: event.detail });
		}
	}

	_initialize() {
		subscribe(this.channel, -1, response => {
			// console.log("New message received : ", JSON.stringify(response));
			this._notifyState("OPEN", "message", response);
			const payload = response.data.payload;
			if (this.clientId === payload.toId__c) {
				this.dispatchEvent(
					new CustomEvent("message", {
						detail: {
							type: payload.type__c,
							fromId: payload.fromId__c,
							toId: payload.toId__c,
							msg: payload.message__c,
							private: payload.private__c,
							fromDyno: "N/A",
							toDyno: "N/A",
							dttm: new Date()
						}
					})
				);
			}
		}).then(response => {
			this._client = response;
			this._isConnected = true;
			console.log("Successfully subscribed to : ", JSON.stringify(response.channel));
			this._notifyState("OPEN", "Subscribe", response);
			this.dispatchEvent(new CustomEvent("message", { detail: this.buildMessage("OPEN", this.clientId, "Subscribe") }));
		});
		onError(error => {
			console.error("Received ERROR from server: ", JSON.stringify(error));
			this._close();
		});
	}

	_close() {
		this._isConnected = false;
		unsubscribe(this._client, response => {
			console.log("unsubscribe() response: ", JSON.stringify(response));
		});
		this._notifyState("CLOSED", "Unsubscribe", {});
	}

	_notifyState(newState, operation, event) {
		this.dispatchEvent(new CustomEvent("notifystate", { detail: { old: this._oldState, new: newState, operation, event } }));
		this._oldState = newState;
	}
}
