require('dotenv').load();

const { RtmClient, CLIENT_EVENTS, WebClient } = require('@slack/client');
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

var DomoticsBot = require('./lib/domoticzbot');

const token = process.env.SLACK_TOKEN;

function HomeBot(token) {


  // Cache of data
  this.appData = {};

  this.rtm = new RtmClient(token, {
    dataStore: false,
    useRtmConnect: true,
    logLevel: 'info'
  });

  this.web = new WebClient(token);

  this.isChatMessage = (message) => {
    return message.type === 'message' && Boolean(message.text);
  };
  
  this.isMentioningHomeBot = (message) => {
    return message.text.toLowerCase().indexOf(this.appData.selfName.toLowerCase()) > -1
    || message.text.toLowerCase().indexOf(this.appData.selfId.toLowerCase()) > -1
  }

  this.onMessageReceived = (message) => {
    console.log(message);
    console.log(this);
    if (this.isChatMessage(message)&&this.isMentioningHomeBot(message)){
      console.log("talking to me");
        this.web.users.info(message.user).then((res) => {
          console.log(res);
          this.rtm.sendMessage(`Hello <@${message.user}>`, message.channel)
          .then(() => console.log(`Message sent to channel ${message.channel}`))
          .catch(console.error);
        });
}
  };

  this.onRTMAuthenticated = (connectData) => {
    // Cache the data necessary for this app in memory
    console.log(connectData);
    this.appData.selfId = connectData.self.id;
    this.appData.selfName = connectData.self.name;
    console.log(`Logged in as ${this.appData.selfId} of team ${connectData.team.id}`);
  }

  this.onRTMConnectionOpened = () => {
    console.log(`Ready`);
    // Wait for the channels list response
    this.web.channels.list().then((res) => {
      this.appData.channels = res.channels;
      const channel = res.channels.find(c => c.name==='general');
      if (channel) {
        this.rtm.sendMessage(`Hello, world! ${channel.name}`, channel.id)
          .then(() => console.log(`Message sent to channel ${channel.name}`))
          .catch(console.error);
      } else {
        console.log('This bot does not belong to any channels, invite it to at least one and try again');
      }
    });
  }
  
    
  this.rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, this.onRTMAuthenticated);
  this.rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, this.onRTMConnectionOpened);
  this.rtm.on(RTM_EVENTS.MESSAGE, this.onMessageReceived);

  this.rtm.start();

};


const homeBot = new HomeBot(token);



