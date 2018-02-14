require('dotenv').load();

const { RtmClient, CLIENT_EVENTS, WebClient } = require('@slack/client');
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

// An access token (from your Slack app or custom integration - usually xoxb)
const token = process.env.SLACK_TOKEN;

// Cache of data
const appData = {};

// Initialize the RTM client with the recommended settings. Using the defaults for these
// settings is deprecated.
const rtm = new RtmClient(token, {
  dataStore: false,
  useRtmConnect: true,
  logLevel: 'info'
});

// Need a web client to find a channel where the app can post a message
const web = new WebClient(token);

// Load the current channels list asynchrously
let channelsListPromise = web.channels.list();

// The client will emit an RTM.AUTHENTICATED event on when the connection data is avaiable
// (before the connection is open)
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (connectData) => {
  // Cache the data necessary for this app in memory
  appData.selfId = connectData.self.id;
  console.log(`Logged in as ${appData.selfId} of team ${connectData.team.id}`);
});

// The client will emit an RTM.RTM_CONNECTION_OPEN the connection is ready for
// sending and recieving messages
rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {
  console.log(`Ready`);
  // Wait for the channels list response
  channelsListPromise.then((res) => {

    // Take any channel for which the bot is a member
    const channel = res.channels.find(c => c.is_member);

    if (channel) {
      // We now have a channel ID to post a message in!
      // use the `sendMessage()` method to send a simple string to a channel using the channel ID
      rtm.sendMessage('Hello, world!', channel.id)
        // Returns a promise that resolves when the message is sent
        .then(() => console.log(`Message sent to channel ${channel.name}`))
        .catch(console.error);
    } else {
      console.log('This bot does not belong to any channels, invite it to at least one and try again');
    }
  });
});


rtm.on(RTM_EVENTS.MESSAGE, function(message) {
  console.log(message);
});

// Start the connecting process
rtm.start();