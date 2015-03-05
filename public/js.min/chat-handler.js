var userName = prompt("What's your name? Must be at least 3 characters.");
var userGiven;
var dateData = new Date();
var hours = dateData.getHours();
var minutes = dateData.getMinutes();
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
date = normalizeHours(hours) + ":" + normalizeMinutes(minutes);
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
filter = filter.replace(/(:\))/ig, "<img id='smile' src='/images/emojis/smile.png'>");
filter = filter.replace(/(:\-\))/ig, "<img id='smile' src='/images/emojis/smile.png'>");
	//indifferents
filter = filter.replace(/(:\/)/ig, "<img id='indif' src='/images/emojis/indif.png'>");
filter = filter.replace(/(:\-\/)/ig, "<img id='indif' src='/images/emojis/indif.png'>");
return filter;
console.log(filter);
}