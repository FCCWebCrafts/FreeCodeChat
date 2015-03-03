var userName = prompt("What's your name?");
var dateData = new Date();
var hours = dateData.getHours();
var minutes = dateData.getMinutes();
var socket = io();

function minutePadding(n){
	if (n.length === 1){n = "0" + n;}
	return n;
}
function normalizeHours(n){
	if (n > 12){n -= 12;}
	if (n === 0){n = 12;}
	return n;
}
date = normalizeHours(hours) + ":" + minutePadding(minutes);

$("form").submit(function(){
	socket.emit("chat message", "[" + date + "] " + userName + ": " + $("#msg").val());
	$("#msg").val("");
	return false;
});
socket.on("chat message", function(msg){
	$("#messages").append($("<li>").text(msg) );
	$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
});