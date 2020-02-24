public class Publisher {
	@AuraEnabled
	public static void publish(String channel, String type, Integer fromId, Integer toId, String msg, Integer numberClients) {
		if (channel == '/event/Demo__e') {
			List<Demo__e> demoEvents = new List<Demo__e>();
			if (toId == -1) {
				for (Integer i = 1; i <= numberClients; i++) {
					demoEvents.add(createEvent(channel, type, fromId, i, msg, false));
				}
			} else {
				demoEvents.add(createEvent(channel, type, fromId, toId, msg, true));
			}
			List<Database.SaveResult> results = EventBus.publish(demoEvents);
			// Inspect publishing result for each event
			for (Database.SaveResult sr : results) {
				if (sr.isSuccess()) {
					System.debug('Successfully published event.');
				} else {
					for (Database.Error err : sr.getErrors()) {
						System.debug('Error returned: ' + err.getStatusCode() + ' - ' + err.getMessage());
					}
				}
			}
		}
	}

	private static Demo__e createEvent(String channel, String type, Integer fromId, Integer toId, String msg, Boolean isPrivate) {
		Demo__e d = new Demo__e();
		d.type__c = type;
		d.fromId__c = fromId;
		d.toId__c = toId;
		d.message__c = msg;
		d.private__c = isPrivate;
		System.debug(d);
		return d;
	}
}
