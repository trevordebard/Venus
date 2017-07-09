var HTTPS = require('https');
var botID = process.env.BOT_ID;
var groupID = "32215535";
var EventEmitter = require("events").EventEmitter;
var groupData = new EventEmitter();


groupData.on('update',function(outputBool){
  if(outputBool!=null&&outputBool==true){
    groupData.emit('output');
  }
  else if(outputBool!=null){
    getAllMessages(outputBool);
  }
//  console.log(groupData.data);
})
groupData.on('output',function(){
  console.log("groupData string: " + JSON.stringify(groupData);
  console.log("groupData.data string" + JSON.stringify(groupData.data);
  postMessage(interpretGroupJSON(groupData.data));
})

var messageData = new EventEmitter();
messageData.on('update',function(newData,statusCode,memberName){
  if(statusCode!=304) {
    console.log("Reading...")
    //console.log("this is in update");
    if(messageData.data == null)
      messageData.data = [];
    messageData.data.push(newData);

  //  console.log(messageData.data);
    messageData.emit('repeat',memberName);
  }
  else{
    console.log("Done Reading.");
    messageData.emit('output',memberName)
  }
});


function respond(){
  var message = JSON.parse(this.req.chunks[0]);
  //this.res.writeHead(200);
  //postMessage("Testing.");
  //console.log(message);
  if(message.user_id!="402936"){//This is the bot id
    this.res.writeHead(200);
    if(message.text=="Ace, analyze the group."){
        analyzeGroup();
    }
    else if(message.text=="Ace, introduce yourself."){
      introduction();
    }
    else if(message.text.substring(0,12)=="Ace, analyze"){
      this.res.writeHead(200);
      analyzeMember(message.text.substring(13,message.text.length));
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
    path: '/v3/groups/'+groupID+'?token=rxtbJYAhwz0NuvMhQPuDczRqMKJpOKoMyXGeWme3',
    method: 'GET'
  }
  //Some things get logged to the console for context information on our back end, but isn't super necessary.
  var getReq = HTTPS.request(getReqOptions, function(res) {
  //  console.log("statusCode: ", res.statusCode);//Request status
  //  console.log("headers: ", res.headers);//header info on the request, not 100% sure what all this is, but why not keep it


    //the "data" propery is what we actually want to retrieve
    res.on('data', function(d) {
    //    console.info('GET result:\n');
        //It comes in as JSON and so it has to get passed to the function that parses it, and then passed into postMessage to send to group
        groupData.data = JSON.parse(d);
        groupData.emit('update',outputBool);
      //  console.info('\n\nCall completed');
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