var userName;
function setUserName(){
	 userName = prompt("What's your name? Must be between 3-12 characters long.");
	if(userName.length >14 ||
		userName.match(/[\`\~\|\<\>\s,\?\*\&\^%\$#@!\(\)\\\/\{\}=+\;\:\"\']/ig) ||
		userName.match(/[\-\_\.]/ig) &&
		userName.match(/[\-\_\.]/ig).length > 1 ){
		alert("User name cannot contain special characters.\n\n Exceptions: - _ . \n\n Limited to 1 use of one of these.");
		setUserName();
	}
}
setUserName();
var userGiven;
var date;
var dateData;
var hours;
var minutes;
var timePeriod;
var socket = io();
//setup local time
function setTimePeriod(){
	if(hours >= 0 && hours < 13 )
		{timePeriod = "am";}
	else
		{timePeriod = "pm";}
}
function normalizeHours(n){
	if (n > 12){n -= 12;}
	if (n === 0){n = 12;}
	return n;
}
function normalizeMinutes(n){
	if (n < 10){n = "0" + n;}
	return n;
}
function updateTime(){
	var dateData = new Date();
	var hours = dateData.getHours();
	var minutes = dateData.getMinutes();
	date = normalizeHours(hours) + ":" + normalizeMinutes(minutes);
	window.setTimeout(updateTime, 100);
	console.log(date);
}
updateTime();
//socket emit events
if(userName !== "" && userName.length >= 3){
	socket.emit("join", userName);
	userGiven = true;
}
$("form").submit(function(){
	if(userGiven === true){
		setTimePeriod();
		socket.emit("chat message", $("#msg").val());
		$("#msg").val("");
		return false;
	}
});
socket.on("chat message", function(who, msg){
	setTimePeriod();
	$("#messages").append($("<li class='chat'>").html("[" + date + " " + timePeriod + "] <span class='user'> " + who + "</span>: " + regexFilter(msg) ) );
	$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
	
});
socket.on("update", function(msg){
	setTimePeriod();
	$("#messages").append($("<li class='update'>").html("[" + date + " " + timePeriod + "] " + msg) );
	$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
});
socket.on("command", function(msg){
	setTimePeriod();
	$("#messages").append($("<li class='command'>").html("[" + date + " " + timePeriod + "] " + msg) );
	$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
});
// regex for emojis
function regexFilter(filter){
	//smiles
	filter = filter.replace(/(http(s)?[:\/\/]*)([a-z0-9\-]*)([.][a-z0-9\-]*)([.][a-z]{2,3})?([\/a-z0-9?=%_\-&#]*)?/ig, "<a href='" + filter.match(/(http(s)?[:\/\/]*)([a-z0-9\-]*)([.][a-z0-9\-]*)([.][a-z]{2,3})?([\/a-z0-9?=%_\-&#]*)?/ig) + "' target='_blank'>" + filter.match(/(http(s)?[:\/\/]*)([a-z0-9\-]*)([.][a-z0-9\-]*)([.][a-z]{2,3})?([\/a-z0-9?=%_\-&#]*)?/ig) + "</a>");
	filter = filter.replace(/(:\))/ig, "<img id='smile' src='/images/emojis/smile.png'>");
	filter = filter.replace(/(:\-\))/ig, "<img id='smile' src='/images/emojis/smile.png'>");
		//indifferents
	//filter = filter.replace(/([^a-z]:\/[^\/])/ig, "<img id='indif' src='/images/emojis/indif.png'>");
	filter = filter.replace(/(:\-\/)/ig, "<img id='indif' src='/images/emojis/indif.png'>");
	return filter;
	console.log(filter);
}

//links
$("#chatbox #messages a").on("click", function(){
	alert("You are about to leave this page to visit a link posted in the chat. \n\n Do you wish to continue?");
})