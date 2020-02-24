/* eslint-disable no-debugger */
/* eslint-disable no-alert */
/* eslint-disable no-console */

export default class Websocket {
	_Id;
	_events = {};
	_dyno = null;
	_pinger = null;
	_client = null;
	_oldState = "CLOSED";
	_manualClose = false;
	_isConnected = false;

	channel;
	clientId;

	get title() {
		let title = "";
		if (this._Id && this._dyno) {
			title = `${this._Id}@${this._dyno}`;
		}
		return title;
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
			this._Id = null;
			this._client.close();
		}
	}

	publish(message) {
		// Message is the full message, not just a string. You could use this.buildMessage() to build it.
		this._client.send(message);
		this._notifyState("publish", undefined);
	}

	buildMessage(type, toId, data) {
		return JSON.stringify({ type, fromWsId: this._Id, toWsId: toId, msg: data ? data : "NO DATA", dttm: new Date() }, null, 2);
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
		if (this._client) {
			return;
		}

		if (this.channel) {
			this._client = new WebSocket(this.channel);
			this._notifyState("initialize", undefined);
		} else {
			this._client = null;
			alert(`server: [${this.channel}] has not been set!`);
			return;
		}

		this._client.onclose = event => {
			this._isConnected = false;
			this._notifyState("close", event);

			if (!this._manualClose) {
				// Try to reconnect.
				// event.code === 1000 means that the connection was closed normally.

				if (!navigator.onLine) {
					alert("You are offline. Please connect to the Internet and try again.");
				} else {
					this.open();
				}
			}
		};

		this._client.onerror = event => {
			this._Id = "";
			this._isConnected = false;
			clearInterval(this._pinger);
			this._notifyState("error", event);
		};

		this._client.onmessage = event => {
			const data = event.data;
			let jsonData = JSON.parse(data);
			this._notifyState("message", event);

			if (jsonData.type === "REGISTERED") {
				this._Id = jsonData.fromWsId;
			}

			if (["CONNECTED", "ECHO", "PONG"].includes(jsonData.type)) {
				const oldDyno = this._dyno;
				const newDyno = jsonData.fromDyno;
				this._dyno = newDyno;

				if (oldDyno && oldDyno !== newDyno) {
					const msg = JSON.stringify({ msg: "this._dyno changed", fromId: this._Id, oldDyno, newDyno }, null, 1);
					// alert(msg);
					console.log(msg);
				}
			}

			if (jsonData.type !== "PONG") {
				jsonData.toId = jsonData.toWsId;
				jsonData.fromId = jsonData.fromWsId;
				delete jsonData.toWsId;
				delete jsonData.fromWsId;
				this.dispatchEvent(new CustomEvent("message", { detail: jsonData }));
			}
		};

		this._client.onopen = event => {
			this._isConnected = true;
			this._manualClose = false;
			this._notifyState("open", event);

			// eslint-disable-next-line @lwc/lwc/no-async-operation
			this._pinger = setInterval(() => {
				if (this._isConnected && this._Id) {
					this._client.send(this.buildMessage("PING", 0, "Keep Alive"));
					this._notifyState("timer", undefined);
				}
			}, 30 * 1000);
		};
	}

	_notifyState(operation, event) {
		const newState = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"][this._client.readyState];
		this.dispatchEvent(new CustomEvent("notifystate", { detail: { old: this._oldState, new: newState, operation, event } }));
		this._oldState = newState;
	}
}
