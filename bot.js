var HTTPS = require('https');
var botID = process.env.BOT_ID;
var groupID = "32215535";
var EventEmitter = require("events").EventEmitter;
var groupData = new EventEmitter();
var userData = new EventEmitter();


groupData.on('output',function(){
  console.log("groupData string: " + JSON.stringify(groupData));
  console.log("groupData.data string" + JSON.stringify(groupData.data));
  postMessage(interpretGroupJSON(groupData.data));
})


function respond(){
  var message = JSON.parse(this.req.chunks[0]);
  if(message.user_id!="402936"){//This is the bot id
    this.res.writeHead(200);
    if(message.text=="Ace, analyze the group."){
        analyzeGroup();
    }
    else if(message.text=="previous groups") {
    	showFormerGroups();
    }
    else if(message.text == "DM Tristan") {
    	postMessage("Okay. Will do...");
    	sendDirectMessage("29704127", "Penis");
    }
    else if(message.text == "DM Dorothy") {
    	postMessage("Okay. Will do...");
    	sendDirectMessage("29326293", "Penis");
    }
    else if(message.text == "DM Trevor") {
    	postMessage("Okay. Will do...");
    	sendDirectMessage("8280867", "Penis");
    }
    else if(message.text.substring(0, 7) == "User_Id") {
    	console.log("we outchea");
    	console.log(message.text.length);
    	var name = message.text.substring(8, message.text.length);
    	console.log("NAME: " + name);
    	getMemberId(name);
    }
    else if(message.text=="test") {
    	sendDM();
    }
    else if(message.text=="Ace, introduce yourself."){
      introduction();
    }
    else if(message.text.substring(0,12)=="Ace, analyze"){
      this.res.writeHead(200);
    }
  }
  this.res.end();
}


function introduction(){
  var response = "Hi, I'm the analytical chat engine, or ACE.\nI don't have very much functionality at the moment, but I can give very basic stats about this group.";
  postMessage(response);
}

function getGroupData(outputBool){
  var tempGroupData;
  var getReqOptions = {
    hostname: 'api.groupme.com',
    path: '/v3/groups/'+groupID+'?token=UY5lfCVqEPlpQhge4UlydU6e6iQojUfmFPNCr2yB',
    method: 'GET'
  }
  //Some things get logged to the console for context information on our back end, but isn't super necessary.
  var getReq = HTTPS.request(getReqOptions, function(res) {
	    res.on('data', function(d) {
        groupData.data = JSON.parse(d);
       	groupData.emit('output');
      });
  });

  //some error information, no handling so if theres an error it WILL crash haha.
  getReq.end();
  getReq.on('error', function(e) {
  	console.error(e);
  });
}

function getMemberId(name) {
  console.log("getMemberID call");
  var tempGroupData;
  var getReqOptions = {
    hostname: 'api.groupme.com',
    path: '/v3/groups/'+groupID+'?token=UY5lfCVqEPlpQhge4UlydU6e6iQojUfmFPNCr2yB',
    method: 'GET'
  }
  //Some things get logged to the console for context information on our back end, but isn't super necessary.
  var getReq = HTTPS.request(getReqOptions, function(res) {
	    res.on('data', function(d) {
	    console.log('before parse');
        userData.data = JSON.parse(d);
        console.log("after parse");
        console.log("members: " + JSON.stringify(userData.data.response.members));
        members = userData.data.response.members;
        for(var i=0; i < members.length; i++) {
        	if(members[i].nickname ==  name) {
        		console.log(name+ ": " + members[i].user_id);
        		postMessage(name + ": " + members[i].user_id);
        	}
        }
        userData.emit('output');
      });
  });
  //some error information, no handling so if theres an error it WILL crash haha.
  getReq.end();
  getReq.on('error', function(e) {
  	console.error(e);
  });
}



function analyzeGroup(){
  getGroupData(true);
}



function interpretGroupJSON(group){
  console.log("group: " + group);
  group = group.response;
  console.log("group.response: " + group);
  console.log("stringify members: " + JSON.stringify(group.members));
  var output = "------Group Analysis------";
  output+="\nGroup ID: "+group.id;
  output+="\nGroup Description: "+group.description;
  var creatorID = group.creator_user_id;
  output+="\nNumber of messages since creation: "+group.messages.count;
  memberList = group.members;
  output+="\nNumber of members: "+memberList.length;
  for(var i =0;i<memberList.length;i++){
    if(creatorID==memberList[i].user_id){
      output+="\n"+memberList[i].nickname+" created this group.";
      output+="\n"+memberList[i].image_url;
    }
  }
  return output;
}


function sendDirectMessage(userId, message) {
  var options, body, botReq;

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/direct_messages?token=UY5lfCVqEPlpQhge4UlydU6e6iQojUfmFPNCr2yB',
    method: 'POST'
  };

  	body = { 
    	"source_guid": "5257bdd049240135837b22000b9ea932",
    	"recipient_id": userId,
   		"text": message
  };

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        //neat
      }
      if(res.statusCode == "400") {
      	console.log("error? : " + res.StatusCode);
      	 console.log("error? ALSKJDF: " + res.data);
      	 console.log('rejecting bad status code ' + res.statusCode);
        console.log('MESSAGE: ' + (res.statusMessage));

      }
      else{
        console.log('rejecting bad status code ' + res.statusCode);
        console.log('MESSAGE: ' + (res.statusMessage));

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
        botReq.emit(error);
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