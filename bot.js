var HTTPS = require('https');
var botID = process.env.BOT_ID;
var groupID = "31980727";
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
  console.log("groupData.on(output.asljdkf) call. about to do postMessage");
  console.log("groupdata.data: " + groupData.data);
  console.log("groupdata.data...stringify" + JSON.stringify(groupData.data));
  postMessage(findGroupID(groupData.data));
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

messageData.on('repeat',function(memberName){
  var latestBatch = messageData.data.pop();
  console.log("Latest Batch befor JSON Parse:"+latestBatch);
  var messageBatchJSON = JSON.parse(latestBatch);
  console.log("Latest Batch after JSON parse: "+messageBatchJSON);
  messageData.data.push(messageBatchJSON);
  var messageList = messageBatchJSON.response.messages;
  var lastMessageID = messageList[messageList.length-1].id;
//  console.log(lastMessageID);
   return getAllMessages(memberName,lastMessageID);
});
messageData.on('output',function(memberName){
  outputMemberData(memberName);
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
    else if(message.text == "show groups") {
    	getGroupData();
    }
  }
  this.res.end();
}

function introduction(){
  var response = "Hi, I'm the analytical chat engine, or ACE.\nI don't have very much functionality at the moment, but I can give very basic stats about this group.";
  postMessage(response);
}

function findMemberAvatar(memberName,memberList){
  if(memberList==null){
    return "-1";//in order to minimize requests and keep it efficient, the group needs to be analyzed to initialize our member list first.
  }
  else{
    if(memberName.substring(0,1)=='@'){
      memberName = memberName.substring(1,memberName.length);//trims the @ symbol and keeps the name.
    }
    for(var i=0;i<memberList.length;i++){
      if(memberList[i].name==memberName){
        return memberList[i].image_url;
      }
    }
  }
}

function outputMemberData(memberName){
//  console.log("outputting member data");
  var memberList = groupData.data.response.members;
//  console.log("this is the group data "+groupData.data.response);
  var messageList = messageData.data;
//  console.log("This is the log message for the whole message List:"+ messageList);
//  console.log(memberList);
  var memberID = findMemberID(memberName,memberList);
  if(memberName.substring(0,1)=='@'){
    postMessage("Of course sir. I'll send the data for "+memberName+" momentarily.");
  }
  else{
    postMessage("Of course sir. I'll send the data for @"+memberName+" momentarily.");
  }
  var memberPicURL = findMemberAvatar(memberName,memberList);
  var idMessages = new Array(messageList.length);
  for(var i=0;i<messageList.length;i++){
//    console.log("message list [i]: "+JSON.stringify(messageList[i].response.messages));
      idMessages[i] = messageList[i].response.messages.filter(function(message){
        return message.user_id==memberID;
      })
  }
  var tempMessages = [];
  for(var i=0;i<idMessages.length;i++){
    if(idMessages[i].length!=0){
      for(var j=0;j<idMessages[i].length;j++){
        if(idMessages[i][j]!=null){
          tempMessages.push(idMessages[i][j]);
        }
      }
    }
  }
  idMessages=tempMessages;
//  console.log("ID MESSAGES: "+JSON.stringify(idMessages));
  var numMessages = idMessages.length;
  var firstMessage = idMessages[idMessages.length-1];
  var firstMessageContent = firstMessage.text;
  var firstMessageTime = timeConverter(firstMessage.created_at);
  var messagesEachDay =calculateAverageMessagePerDay(firstMessage.created_at*1000,numMessages);
  var percentOfTotal = messageList.length/idMessages.length;
  console.log("This is memberName : "+memberName);
  if(memberName.substring(0,1)=='@'){
    memberName = memberName.substring(1,memberName.length);
  }
  var response = '------Analysis for '+memberName+'------';
  response+='\nName: '+memberName;
  response+='\nID: '+memberID;
  response+='\nNumber of messages sent: '+numMessages;
  response+='\nStart Time: '+firstMessageTime;
  response+='\nAverage number of messages everyday: '+messagesEachDay;
  response+="\nPercent of total groupme messages: "+percentOfTotal*10+"%";
  response+="\nTheir very first message: "+firstMessageContent;
  response+='\nAvatar: '+memberPicURL;
  postMessage(response);
}
function analyzeMember(memberName){
  getGroupData(memberName);
//  getAllMessages(memberName);
}

function getAllMessages(memberName,lastMessageID){
  var getReqOptions;
  console.log("Making an HTTP GET Request");
  if(lastMessageID == null){
    getReqOptions = {
      hostname: 'api.groupme.com',
      path: '/v3/groups/'+groupID+'/messages?token=rxtbJYAhwz0NuvMhQPuDczRqMKJpOKoMyXGeWme3&limit=100',
      method: 'GET'
    }
  }
  else{
    getReqOptions = {
      hostname: 'api.groupme.com',
      path: '/v3/groups/'+groupID+'/messages?token=rxtbJYAhwz0NuvMhQPuDczRqMKJpOKoMyXGeWme3&limit=100&before_id='+lastMessageID,
      method: 'GET'
    }
  }
  //Some things get logged to the console for context information on our back end, but isn't super necessary.
  var getReq = HTTPS.request(getReqOptions, function(res) {
  //  console.log("statusCode: ", res.statusCode);//Request status
//    console.log("headers: ", res.headers);//header info on the request, not 100% sure what all this is, but why not keep it
    //the "data" propery is what we actually want to retrieve
    res.on('data', function(d) {
      //  console.info('GET result:\n');
        //The messages come in batches, so we read the batch, add it to our list, then find the next batch.
        messageData.emit('update',d,res.statusCode,memberName);
      //  console.info('\n\nCall completed');
      });

      res.on('end',function(){
        var dummy = null;
        if(res.statusCode==304){
          messageData.emit('update',dummy,res.statusCode,memberName);
        }
      });

  });
    //some error information, no handling so if theres an error it WILL crash haha.
  getReq.end();
  getReq.on('error', function(e) {
    console.error(e);
  });
}


function findMemberID(memberName,memberList){
  if(memberList==null){
    console.log("Memberlist was null.");
    return "-1";//in order to minimize requests and keep it efficient, the group needs to be analyzed to initialize our member list first.
  }
  else{
    if(memberName.substring(0,1)=='@'){
      memberName = memberName.subString(1,memberName.length);//trims the @ symbol and keeps the name.
    }
    console.log("Searching"+memberList+" memberlist for "+memberName);
    for(var i=0;i<memberList.length;i++){
  //    console.log("if "+memberList[i].nickname+" == "+memberName);
      var tempName = JSON.stringify(memberList[i].nickname);
      tempName = tempName.substring(1,tempName.length-1);
      var nameEqual = true;
      for(var j =0; j<tempName.length;j++){
    //    console.log(tempName.charAt(j)+" == "+memberName.charAt(j)+" "+(tempName.charAt(j)===memberName.charAt(j)));
        if(tempName.charAt(j)!=memberName.charAt(j))
          nameEqual = false;
      }
      if(nameEqual){
        console.log("Found "+memberName);
        return memberList[i].user_id;
      }
    }
  }
}
function getGroupData(){
	console.log("getGroupData call");
  var tempGroupData;
  var getReqOptions = {
    hostname: 'api.groupme.com',
    path: '/v3/groups/?token=UY5lfCVqEPlpQhge4UlydU6e6iQojUfmFPNCr2yB',
    method: 'GET'
  }
  //Some things get logged to the console for context information on our back end, but isn't super necessary.
  var getReq = HTTPS.request(getReqOptions, function(res) {
  //  console.log("statusCode: ", res.statusCode);//Request status
  //  console.log("headers: ", res.headers);//header info on the request, not 100% sure what all this is, but why not keep it


    //the "data" propery is what we actually want to retrieve
    res.on('data', function(d) {
    //    console.info('GET result:\n');
        
        console.log("groupdata.data before parse: " + groupData.data);
        //It comes in as JSON and so it has to get passed to the function that parses it, and then passed into postMessage to send to group
        groupData.data = JSON.parse(d);
        console.log("groupdata.data after parse: " + groupData.data);
		console.log("groupdata.data before parse stringified: " + JSON.stringify(groupData.data));

        groupData.emit('output'); 
      //  console.info('\n\nCall completed');
      });
  });

  //some error information, no handling so if theres an error it WILL crash haha.
  getReq.end();
  getReq.on('error', function(e) {
  console.error(e);
  });
}


function findGroupID(groupdata) {
	console.log("groupdata...stringify: " + JSON.stringify(groupdata));
	group = groupdata.response;
	console.log("group: " + group);
	//console.log("groupdata...parse: " + JSON.parse(groupdata));


	for(var i=0; i<group.length; i++) {
		if(group[i].name == "Poker") {
			return group[i].group_ID;
		}
	}
	return "ERROR";
}

function analyzeGroup(){
  getGroupData(true);
}

function interpretGroupJSON(group){
  group = group.response;
  var output = "------Group Analysis------";
  output+="\nGroup ID: "+group.id;
  output+="\nGroup Description: "+group.description;
  var creatorID = group.creator_user_id;
  var creationDate = timeConverter(group.created_at);
  output+="\nTime Created: "+creationDate;
  output+="\nNumber of messages since creation: "+group.messages.count;
  var avgMessages = calculateAverageMessagePerDay(group.created_at*1000,group.messages.count);//gotta multiply by a thousand bc seconds->millis
  output+="\nAverage number of messages per day: "+avgMessages;
  memberList = group.members;
  output+="\nNumber of members: "+memberList.length;
  output+="\nAverage number of messages sent by a member each day: "+(avgMessages/memberList.length);
  for(var i =0;i<memberList.length;i++){
    if(creatorID==memberList[i].user_id){
      output+="\n"+memberList[i].nickname+" created this group.";
      output+="\n"+memberList[i].image_url;
    }
  }

  return output;
}

function calculateAverageMessagePerDay(dateCreated,numMessages){
  var currDate = Date.now();
  var timeDiff = currDate-dateCreated;
  var conversionFactor = 86400000;//This is the number of millis in a day.
  var daysPassed = timeDiff/conversionFactor; //dividing the number of millis since the group was created by millis in a day gives us days since creation.
  console.log("this is the number of days passed. it's prob wrong.");
  console.log(daysPassed);
  var avgMessagePerDay = numMessages/daysPassed;
  return avgMessagePerDay;
}

function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
  return time;
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