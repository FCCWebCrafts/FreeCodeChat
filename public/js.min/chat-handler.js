~(function () {
	var socket = io();
	var userName;
	var userList;
	var regUser;
	//set user name
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
	//get time for current users
	function getTimeNow() {
		return moment().format('h:mm a');
	}
	//get relative of chat log for new users
	function logDate(time){
		var now = new Date(time);
		var hours = now.getHours();
		var minutes = now.getMinutes();
		if(hours > 12){ hours -= 12;}
		if(hours === 0){ hours = 12;}
		if(minutes < 9){ minutes = "0" + minutes;}
		return hours + ":" + minutes;
	}
	function scrollToBottom() {
		$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
	}

	socket.on("used", function(){
		alert("Sorry, that user name is unavailable.");
		setUserName();
	});

	socket.on("open", function(){
		socket.emit("join", userName);
		regUser = new RegExp("[@](" + userName + ")\\b", "gi");
		console.log(regUser);
	});

	socket.on("illegal", function(res){
		alert(res);
	});
	//get user list
	socket.on("user list", function(list){
		list = list.split(" ");
		list.pop();
		userList = list.join(", ") + ".";
		$("#user-list").text(userList);
	});
	//socket oresponse on chat log
	socket.on("chat log", function(time, who, msg){
		$("#messages").append($("<li class='chat'>").html("[<span class='log'>" + logDate(time) + "</span>] <span class='user'> " + who + "</span>: " + regexFilter(msg, who) ) );
		$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;

	});
	//socket response on chat message
	socket.on("chat message", function(who, msg){
		$("#messages").append($("<li class='chat'>").html("[" + getTimeNow() + "] <span class='user'> " + who + "</span>: " + regexFilter(msg, who) ) );
		scrollToBottom();
	});
	//socket response on update
	socket.on("update", function(msg){
		$("#messages").append($("<li class='update'>").html("[UPDATE] " + msg) );
		scrollToBottom();
	});
	//socket response on command
	socket.on("command", function(msg){
		$("#messages").append($("<li class='command'>").html("[COMMAND] " + msg) );
		scrollToBottom();
	});
	//filter chat for links and emites
	function regexFilter(filter, person){
		//smiles
		filter = filter.replace(/(http(s)?[:\/\/]*)([a-z0-9\-]*)([.][a-z0-9\-]*)([.][a-z]{2,3})?([\/a-z0-9?=%_\-&#]*)?/ig, "<a href='" + filter.match(/(http(s)?[:\/\/]*)([a-z0-9\-]*)([.][a-z0-9\-]*)([.][a-z]{2,3})?([\/a-z0-9?=%_\-&#]*)?/ig) + "' target='_blank'>" + filter.match(/(http(s)?[:\/\/]*)([a-z0-9\-]*)([.][a-z0-9\-]*)([.][a-z]{2,3})?([\/a-z0-9?=%_\-&#]*)?/ig) + "</a>");
		//smiles
		filter = filter.replace(/(:\))/ig, "<img id='smile' src='/images/emojis/smile.png'>");
		filter = filter.replace(/(:\-\))/ig, "<img id='smile' src='/images/emojis/smile.png'>");
		//indifferents
		filter = filter.replace(/\B(:\/)\B/ig, "<img id='indif' src='/images/emojis/indif.png'>");
		filter = filter.replace(/(:\-\/)/ig, "<img id='indif' src='/images/emojis/indif.png'>");
		//match mentions
		if(filter.match(regUser) && person.toLowerCase() !== userName.toLowerCase() ){
			var ment = filter.indexOf("@");
			var sub = filter.substring(ment-20,ment+20);
			//console.log(filter.slice(ment-30) );
			if(filter.slice(ment-20).length > sub.length){
				$("body").append("<div class='notification'>"+person+" Mentioned You: "+sub+"...</div>");
			} else {
				$("body").append("<div class='notification'>"+person+" Mentioned You: "+sub+"</div>");
			}
			filter = filter.replace(regUser, "<span class='mention'>@"+userName+"</span>");
			killNot();
		}
		return filter;
	}
	function killNot(){
		$(".notification:last").animate({"height": "2em"}, 200);
		setTimeout(function(){
			$(".notification:first").remove();
		}, 5000)
	}
	//chat message submission
	$('form').submit(function(event){
		socket.emit("chat message", $("#msg").val());
		$("#msg").val("");
		event.preventDefault();
	});
	// link warning
	$('#chatbox #messages').on('click', 'a', function(event) {
		var result = confirm("You are about to leave this page to visit a link posted in the chat. \n\n Do you wish to continue?");
		if (!result) {
			event.preventDefault();
		}
	})

	$("#msg").focus();

	setUserName();
}());