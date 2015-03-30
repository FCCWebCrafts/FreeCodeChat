~(function () {
	var socket = io(),
	userName,
	userList, listArray,
	regUser,
	windowFocus = true,
	unread = 0,
	originalTitleMention = "█ " + $("title").html(),
	originalTitle = $("title").html(),
	showTitle = originalTitle;
	room = window.location.href.match(/(http(s)?[:\/\/]*)([a-z0-9\-]*)([.:][a-z0-9\-]*)([.][a-z]{2,3})?([\/a-z0-9?=%_\-&#]*)?/ig)[0];
	//set user name
	//validate user session
	var sessCookie = document.cookie.split("=").pop();
	socket.emit("validate", sessCookie );

	socket.on("signin", function(){
		alert("Please sign in");
		window.location.replace("/login");
	});

	socket.on("validated", function(name){
		userName = name;
		socket.emit("join", userName, room);
		regUser = new RegExp("[@](" + userName + ")\\b", "gi");
	});
	$(window).focus(function() {
		windowFocus = true;
		unread = 0;
		$("title").html(originalTitle);
	}).blur(function() {
		windowFocus = false;
	});
	/*
	setInterval( function() {
		console.log("Window in focus = " + windowFocus);
		var title = $("title").html();
		console.log( title );
	}, 1000);
*/
	//get time for current users
	function getTimeNow() {
		return moment().format('h:mm a');
	}
	//get relative of chat log for new users
	function logDate(time){
		var period = "am";
		var now = new Date(time);
		var hours = now.getHours();
		var minutes = now.getMinutes();
		if(hours > 12){ hours -= 12; period = "pm"}
		if(hours === 0){ hours = 12;}
		if(minutes < 10){ minutes = "0" + minutes;}
		return hours + ":" + minutes + " " + period;
	}
	function scrollToBottom() {
		$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
	}

	socket.on("illegal", function(res){
		alert(res);
	});
	//get user list
	socket.on("user list", function(list){
		listArray = list.split(/[,.]/gi);
		listArray.pop();
		userList = list;
		$("#user-list").text(userList);
	});
	$(window).focus(function() {
		windowFocus = true;
		unread = 0;
		showTitle = originalTitle;
		$("title").html(showTitle);
	}).blur(function() {
		windowFocus = false;
	});
	//get caret positon
	function getCaretPos(input) {
  // Internet Explorer Caret Position (TextArea)
    if (document.selection && document.selection.createRange) {
        var range = document.selection.createRange();
        var bookmark = range.getBookmark();
        var caret_pos = bookmark.charCodeAt(2) - 2;
    } else {
        // Firefox Caret Position (TextArea)
        if (input.setSelectionRange)
          var caret_pos = input.selectionStart;
    }
    return caret_pos;
	}

	//mention
	var caretPosition = 0, selection = 1, subStr, listLen;
	//check for keyup events
	$("#msg").on("keyup", function(){
		if ( $(this).val().charAt( getCaretPos(this) - 1).match(/[@]/gi) ){
			//show list box
			$("#listBox").css({"display": "inline-block"});
			caretPosition = getCaretPos(this) - 1;
		}
		if ( $(this).val().charAt( getCaretPos(this) - 1).match(/[\s]/gi) || $(this).val().charAt( getCaretPos(this) - 1) === "" ){
			//hide list box
			$("#listBox").css({"display": "none"});
		}
		subStr = $(this).val().split("").slice(caretPosition+1).join("");
		var matchedUser = new RegExp("\\b(" + subStr + ")", "gi");
		$("#listBox").html("");
		if(listArray) {
			listArray.map(function(elem, index){
				if (elem.match(matchedUser) && $("#listBox").attr("style") === "display: inline-block;") {
					var match = elem.replace(matchedUser, "<span class='match-box-str'>"+subStr+"</span>");
					$("#listBox").append("<li class='matched-user' data-index='" + (index+1) + "' data-name='" + elem + "'>" + match + "</li>");
				}
			});
		}
		$("#listBox li:nth-child(" + selection + ")").addClass("selected");
	});
	//check for keydown events
	$("#msg").keydown(function(k){
		listLen = $("#listBox .matched-user").size();
		//check for enter key
		if (k.keyCode === 13){
			if ( $("#listBox").attr("style") === "display: inline-block;" ) {
				selectMention();
				return false;
			}
		}
		//check for up key
		if (k.keyCode === 38) {
			selection--;
			if (selection < 1){ selection = listLen}
			$("#listBox li").removeClass("selected");
			return false;
		}
		//check for down key
		if (k.keyCode === 40) {
			selection++;
			if (selection > listLen){ selection = 1}
			$("#listBox li").removeClass("selected");
			return false;
		}
	});
	//mouse hover over user mention
	$(document).on({
		mouseenter: function(){
			$(".matched-user").removeClass("selected");
			selection = $(this).data("index");
			$(this).addClass("selected");
		},
		click: function(){
			selectMention();
		}
	}, ".matched-user");
	//mouse press on user mention

	function selectMention(){
		//attach the full user names to the input value
		$("#msg").val( $("#msg").val() + $("#listBox li:nth-child(" + selection +
		 ")").data("name").split("").slice(subStr.length).join("") );
		//hide list box
		$("#listBox").css({"display": "none"});
		selection = 1;
	}

	//socket response on chat log
	socket.on("chat log", function(time, who, msg){
		$("#messages").append($("<li class='chat'>").html("[<span class='log'>" + logDate(time) + "</span>] <span class='user'> " + who + "</span>: " + regexFilter(msg, who) ) );
		$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
		if(!windowFocus) {
			$("title").text("(" + unread + ") " + originalTitle);
			unread++;
		}
	});
	//socket response on chat message
	socket.on("chat message", function(who, msg){
		$("#messages").append($("<li class='chat'>").html("[" + getTimeNow() + "] <span class='user'> " + who + "</span>: " + regexFilter(msg, who) ) );
		//var title = originalTitle;
		if(windowFocus) {
			$("title").html(originalTitle);
		} else {
			unread++;
			$("title").text("(" + unread + ") " + originalTitle);
		}
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
		filter = filter.replace(/(http(s)?[:\/\/]*)([a-z0-9\-]*)([.][a-z0-9\-]*)([.][a-z]{2,3})?([\/a-z0-9?=%_\-&#]*)?/ig, "<a href='" +
		 filter.match(/(http(s)?[:\/\/]*)([a-z0-9\-]*)([.][a-z0-9\-]*)([.][a-z]{2,3})?([\/a-z0-9?=%_\-&#]*)?/ig) +
		  "' target='_blank'>" +
		   filter.match(/(http(s)?[:\/\/]*)([a-z0-9\-]*)([.][a-z0-9\-]*)([.][a-z]{2,3})?([\/a-z0-9?=%_\-&#]*)?/ig) +
		    "</a>");
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
			if(filter.slice(ment-20).length > sub.length){
				$("body").append("<div class='notification'>"+person+" Mentioned You: "+sub+"...</div>");
			} else {
				$("body").append("<div class='notification'>"+person+" Mentioned You: "+sub+"</div>");
			}
			filter = filter.replace(regUser, "<span class='mention'>@"+userName+"</span>");
			killNot();
			showTitle = originalTitleMention;
			if(windowFocus) {
				$("title").html(originalTitle);
			} else {
				unread++;
				$("title").text( "(" + unread + ") " + showTitle);
			}
			killNot();
		} else {
			if(windowFocus) {
				showTitle = originalTitle;
				$("title").html(originalTitle);
			} else {
				unread++;
				$("title").text("(" + unread + ") " + showTitle);
			}
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
		socket.emit("chat message", $("#msg").val(), room, userName);
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

}());