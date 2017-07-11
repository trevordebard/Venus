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
  console.log(JSON.stringify(message));
  if(message.user_id!="402936"){//This is the bot id
    this.res.writeHead(200);
    
    if(message.text=="simple") {
    	postMessage("it worked");
    }
    else if(message.text.substring(0,9).toLowerCase() == "less talk") {
    	postMessage("I will talk as much as I want");
    }
    
    else if(message.text.substring(0, 7) == "User_Id") {
    	console.log("we outchea");
    	console.log(message.text.length);
    	var name = message.text.substring(8, message.text.length);
    	console.log("NAME: " + name);
    	getMemberId(name);
    }
    else if(message.text.toLowerCase() == "gort status") {
    	showStatus();
    }
    if(message.name == "Memeville") {
    	spongify(message.text);
    }
    if(message.name == 'Mantequilla "Last of the Memecans"') {
    	spongify(message.text);
    }
    if(message.name == "Sean Spicer") {
    	spongify(message.text);
    }
    
  }

  this.res.end();
}


function spongify(string) {
	var output = "";
	for(var i = 0; i < string.length; i++) {
		if (i % 2 != 0) {
            output += string[i].toUpperCase();
        }
        else {
            output += string[i].toLowerCase();
         }   
	}
	postMessage(output);
}

function showStatus() {
	var output = "GORT v0.999a"
	+ "Info: http://botsol.net/gort_sucks"
	+ "Group ID: 27053863, 2647/5000 users"
	+ "Owner: Mr. Magorium (very debatable)"
	+ "Admins: useless"
	+ "0 Trusted, All Pleb users"
	+ "Share URL: https://groupme.com/join_group/27053863/Tot7y2"
	+ "Sec level: overthrown"
	+ "Restricted: Name Topic Avatar Omode Kick"
	+ "Allowed: Join Rejoin Add Chat Others"
	+ "Extras: Antibot...LMAOOOOOO"
	+ "Now: the past's future";
	postMessage(output);
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