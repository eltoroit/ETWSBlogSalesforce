# (Near) Real-Time Salesforce Applications

## What are Real-time applications?

Let’s suppose we are building an application where we know the data are continuously changing, and we want a client to process that information as soon as possible. There are several ways we could architect such a solution. We either ping the application frequently to see if it has data for us (this is a bad idea), we can use Streaming API, or we could use WebSockets.

## So, What Are WebSockets?

Websocket is a mechanism to enable real-time communication between a client and a server.

## Don’t we already have a Streaming API for this?

Streaming API is a great mechanism for building these applications, and depending on your needs, you could use any of the 4 types of events: Pushtopics, Generic Streaming, Platform Events, and Change Data Capture. The difference is that with WebSockets, the client or the server can publish these messages.

## But Streaming API also allows the client to publish messages to the channel, don’t they?

Well, kind of. Pushtopics and Change Data Capture (CDC) messages are always published by Salesforce when there are changes to the Salesforce data, so you can’t publish to those channels.

## But what about Generic Events or Platform Events?

You could publish a Platform Events message from a Process Builder, a Flow, Apex code, REST API, or SOAP API. Salesforce puts the message on the channel. But you can’t publish directly on the channel itself!

## Those are just technical details; we are just splitting hairs.

Not quite. Those are important details, and this makes WebSockets much faster.

## Are the WebSockets faster?

Yes, they are! They are instantaneous, unlike Streaming API, where you can see a bit of a delay. And it’s not only because you publish directly on the channel, but also because they do not use Long Polling!

## What is Long Polling?

Long Polling is the technique that Salesforce uses for Streaming API; it’s an implementation of the Bayeux protocol. The idea is interesting; it keeps the HTTPs connection open as long as possible, which is defined by the standards as 2 minutes.

These are the steps for Streaming API:

1. The client makes an HTTPs call to Salesforce.
2. Salesforce receives the request but does not return an answer until it has one ready, or the request is about to expire (110 seconds).
3. The client receives the response and processes the data if there was any. Remember that it’s possible to have a response without data if the response returned because it would time out.
4. Repeat steps 1-3 forever!

## So how do WebSockets work?

Great question! Let’s follow the wire just like we did for Long Polling. These are the steps for WebSockets:

1. The client makes an HTTPs call to Salesforce.
2. The server and the client flip the HTTPs connection into a WSS channel
3. The client or the server publish messages on this WSS channel
4. Repeat step 3.

## How is this different? Other than being more complicated because the connection has to switch from HTTPs to WSS. I do not get it!

I understand your concern. With Long Polling, the client continuously repeats the 3 steps (1-3) because the connections do get closed. WebSockets take a tiny bit longer to load the application at the start. But after establishing the connection, it is kept open, and the client or the server publishes messages on that channel (only step 3). The connection remains open forever, and you do not need to keep re-open it.

There is also a bit of a delay when publishing the event with Long Polling because it can not use the existing channel!

## I think that I get the idea, but is this noticeable? The communication between the client and the server is fast, right?

I built a sample app to compare WebSockets vs. Platform Events, and I was surprised when I saw the numbers.

<p align="center">
<img src="https://github.com/eltoroit/ETWSBlogStarter/blob/master/Blog/FullScreenSalesforce.png?raw=true">
</p>

This sample app allows me to create any number of clients and publish to all of them; then, I can see how long it took for every client to receive the messages. This chart shows the data when I run the test 100 times with 50 clients. As shown in the chart below, it took an average of 5 seconds for Platform Events, but it took about 0.2 seconds for WebSockets.

<p align="center">
<img src="https://github.com/eltoroit/ETWSBlogStarter/blob/master/Blog/50Clients-EveryMessage.png?raw=true">
</p>

I had seen the WebSocket clients were performing faster, but I was surprised when I saw these numbers. So I decided this was not a good test, because you would never have so many clients in a single browser (unless you are making a test application like this one). So I decided to answer a different question: How long does it take for the first message to arrive? This chart answers that question:

<p align="center">
<img src="https://github.com/eltoroit/ETWSBlogStarter/blob/master/Blog/50Clients-FirstResponse.png?raw=true">
</p>

We can see that WebSockets are still faster (0.050 seconds) than Platform Events (0.300 seconds) by a factor of 6X.

Did you notice how predictable the WebSockets are? That was something that impressed me and noticed while I was running the tests for this blog.

You can see the full <a href="https://github.com/eltoroit/ETWSBlogStarter/blob/master/Blog/Stats.xlsx?raw=true">details of the tests here</a>.

## Wow. I am sold! Does Salesforce support having these WebSockets connections open forever?

Well, yes and no! Salesforce servers do not support WebSockets. What y...

## STOP! Now I am baffled!

What happened?

## WebSockets are cool, but I can’t use them. Game over!

You did not let me finish the last answer. Hold on. Did you see the pictures I showed you before? Did you notice I was running WebSockets on Lightning Experience?

## Now you are just contradicting yourself!

Let me explain, Salesforce servers do not allow you to use WebSockets, but the front-end does! The picture above is from an application I developed some components with LWC, and the JavaScript connects to the WSS server.

This front-end could be built with Aura, LWC or Visualforce if you are still in classic (are you? Never mind!). Salesforce does allow you to make connections from JavaScript to a WebSocket server if you set the CSP.

## CSP?

As explained in the documentation: “The Lightning Component framework uses Content Security Policy (CSP) to impose restrictions on content. The main objective is to help prevent cross-site scripting (XSS) and other code injection attacks. To use third-party APIs that make requests to an external (non-Salesforce) server or to use a WebSocket connection, add a CSP Trusted Site”. By the way, you are allowed to use WebSockets in CSP since Spring ‘19.

## If Salesforce is not the server, which server are you using?

I build a NodeJs server that I run in localhost for testing and Heroku for production. You can see all the code in this repo.

<p align="center">
<a href="https://github.com/eltoroit/ETWSBlogStarter" target="_blank">
<img src="https://github.com/eltoroit/ETWSBlogStarter/blob/master/Blog/RepoLink.png?raw=true" />
</a>
</p>
