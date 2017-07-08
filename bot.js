var HTTPS = require('https');
var botID = process.env.BOT_ID;
var groupID = "31980727";
var EventEmitter = require("events").EventEmitter;
var groupData = new EventEmitter();



function respond(){
  var message = JSON.parse(this.req.chunks[0]);
  //this.res.writeHead(200);
  //postMessage("Testing.");
  //console.log(message);
    this.res.writeHead(200);
    if(message.text=="What is Petty Bot?"){
        introduction();
    }
  this.res.end();
}

function introduction(){
  var response = "I'm a bot Trevor is making to be petty.\nRn I can't do shit...";
  postMessage(response);
}


function postMessage(botResponse) {
  var options, body, botReq;

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : botID,
    "text" : botResponse
  };

  console.log('sending ' + botResponse + ' to ' + botID);

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        //neat
      }
      else{
        console.log('rejecting bad status code ' + res.statusCode);
      }

  });

  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}
exports.respond = respond;