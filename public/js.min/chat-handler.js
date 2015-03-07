var socket = io();

var userName;
var userGiven;
function setUserName(){
	userName = prompt("What's your name? Must be between 3-12 characters long.");
	if(userName.length <3 ||
		userName.length >14 ||
		userName.match(/[\`\~\|\<\>\s,\?\*\&\^%\$#@!\(\)\\\/\{\}=+\;\:\"\']/ig) ||
		userName.match(/[\-\_\.]/ig) &&
		userName.match(/[\-\_\.]/ig).length > 1 ){
		alert("User name cannot contain special characters.\n\n Exceptions: - _ . \n\n Limited to 1 use of one of these.");
		setUserName();
	} else {
		socket.emit("validate", userName);
	}
}
setUserName();
socket.on("used", function(){
	alert("Sorry, that user name is unavailable.");
	setUserName();
});
socket.on("open", function(){
	socket.emit("join", userName);
	userGiven = true;
});
socket.on("illegal", function(res){
	alert(res);
});

// all else
var userList;
function getTime() {
	return moment().format('h:mm a');
}

//socket emit events
socket.on("user list", function(list){
	list = list.split(" ");
	list.pop();
	userList = list;
	console.log("User list: " + userList.length);
});

socket.on("chat message", function(who, msg){
	$("#messages").append($("<li class='chat'>").html("[" + getTime() + "] <span class='user'> " + who + "</span>: " + regexFilter(msg) ) );
	$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;

});
socket.on("update", function(msg){
	$("#messages").append($("<li class='update'>").html("[" + getTime() + "] " + msg) );
	$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
});
socket.on("command", function(msg){
	$("#messages").append($("<li class='command'>").html("[" + getTime() + "] " + msg) );
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
}

//send message
$("form").submit(function(event){
	if(userGiven === true){
		socket.emit("chat message", $("#msg").val());
		$("#msg").val("");
	}
	event.preventDefault();
});

//links
$("#chatbox #messages a").on("click", function(){
	alert("You are about to leave this page to visit a link posted in the chat. \n\n Do you wish to continue?");
})

//focus
$("#msg").focus();
