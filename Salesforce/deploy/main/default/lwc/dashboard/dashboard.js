/* eslint-disable no-debugger */
/* eslint-disable no-alert */
import { LightningElement } from "lwc";

export default class Dashboard extends LightningElement {
	channelUrl = null;
	channelData = {
		all: [
			{ label: "Localhost", value: "WSS|localhost:5001" },
			{ label: "Heroku", value: "WSS|test-wsock01.herokuapp.com" },
			{ label: "Platform Events", value: "PE|/event/Demo__e" }
		],
		selected: null
	};

	postCounter = null;
	postData = {
		firstTime: null,
		masterTimer: null,
		message: null
	};

	clientDataRefresh = 0;
	clientData = {
		all: [],
		count: 5,
		stateValues: [new Set(), new Set(), new Set(), new Set()],
		stateNames: { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 }
	};

	constructor() {
		super();
		this.channel = this.channelData.all[1].value;
	}

	get channel() {
		return this.channelData.selected;
	}
	set channel(value) {
		let parts = value.split("|");
		this.channelData.selected = value;
		switch (parts[0]) {
			case "PE":
				this.channelUrl = parts[1];
				break;
			default:
				this.channelUrl = `wss://${parts[1]}/ws`;
				break;
		}
		this.createClients();
	}

	get displayStates() {
		return Object.keys(this.clientData.stateNames).map(stateName => {
			let stateIdx = this.clientData.stateNames[stateName];
			return { name: stateName, count: this.clientData.stateValues[stateIdx].size };
		});
	}

	connectedCallback() {
		this.createClients();
	}

	handleChannelChange(event) {
		this.channel = event.detail.value;
	}

	handleNumberClientsChanged(event) {
		this.clientData.count = Number(event.target.value);
		this.createClients();
	}

	handleNotifyState(event) {
		const data = event.detail;
		if (data.old) {
			this.clientData.stateValues[this.clientData.stateNames[data.old]].delete(data.clientId);
		}
		this.clientData.stateValues[this.clientData.stateNames[data.new]].add(data.clientId);
		this.clientDataRefresh++;
	}

	handleCountPosts(event) {
		const value = event.detail;
		if (value === 0) {
			this.postCounter = 0;
			this.postData.message = "";
			this.postData.masterTimer = new Date();
		} else {
			if (this.postCounter === null) {
				this.postCounter = 0;
				this.postData.message = "";
				this.postData.masterTimer = new Date();
			}
			this.postCounter++;
			if (this.postCounter === 1) {
				this.postData.firstTime = new Date() - this.postData.masterTimer;
				this.postData.message = ` (First: ${this.postData.firstTime / 1000.0} seconds)`;
			} else if (this.postCounter === this.clientData.count) {
				const diff = new Date() - this.postData.masterTimer;
				this.postData.message = ` (First: ${this.postData.firstTime / 1000.0}, Total: ${diff / 1000.0} seconds)`;
			}
		}
	}

	handleResetPosts() {
		this.postCounter = null;
		this.postData.message = "";
	}

	openAll() {
		this.template.querySelectorAll("c-client").forEach(client => {
			client.open();
		});
	}

	closeAll() {
		this.template.querySelectorAll("c-client").forEach(client => {
			client.close();
		});
	}

	createClients() {
		if (this.clientData.all.length > 0) {
			this.closeAll();
		}

		this.clientData.all = [];
		for (let i = 1; i <= this.clientData.count; i++) {
			this.clientData.all.push({
				key: i
			});
			this.clientData.stateValues[this.clientData.stateNames.CLOSED].add(i);
		}
		this.clientDataRefresh++;
	}
}
