var HTTPS = require('https');
var cool = require('cool-ascii-faces');

var botID = process.env.BOT_ID;

function respond() {
	var message = JSON.parse(this.req.chunks[0]);
	if(message.text == "Venus, what are you") {
		explainVenus();
	}
}

function explainVenus() {
	var response = "Oh, I'm just this thing Trevor created to be petty.\nI don't do shit rn tho.";
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


exports.respond = respond;