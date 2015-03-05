//requirements
var express = require("express")
, app		= express()
, http		= require("http").Server(app)
, io 		= require('socket.io')(http)
, path		= require("path")
, port		= process.env['PORT'] || 3007;

app.use(express.static(path.join(__dirname, 'public')));

var webPages = "/views/";
//route functions
function index(req, res){
	res.setHeader("Content-Type", "text/html");
	res.sendFile(__dirname + webPages + "index.html");
}
function chatPage(req, res){
	res.setHeader("Content-Type", "text/html");
	res.sendFile(__dirname + webPages + "chat.html");
}
//routes
app.get("/", index);
app.get("/chat", chatPage);
//socket
// connection and chat receiving.
var users = {};
var userCount = 0;
var history = [];
var historyLimit = 25;

//chat server connection
io.on("connection", function(socket){
	socket.on("join", function(name){
		users[socket.id] = name;
		io.emit("update", users[socket.id] + " has connected to the server!");
		for(var log in history){
			io.to(socket.id).emit("chat message", "" + history[log].userName, history[log].message);
		}
		userCount = Object.keys(users).length;
		console.log(name + " connected");
		console.log("Users: " + userCount);
	});//end on join
	//on chat msg
	socket.on("chat message", function(msg){
		//validate user
		if(!users[socket.id]){
			return false;
		} else
		{//check script tags
			/*if(msg.match(/(<[a-z]*[a-z0-9=\"\'\/\s]*?>)/i)){
				io.to(socket.id).emit("command", "Unauthorized string combination blocked.");
			} else*/
			msg = msg.replace(/[<]/ig, "&lt;");
			msg = msg.replace(/[>]/ig, "&gt;");
			//check if list command
			if(msg.match(/^([\/]list)/i)){
				var cmdUserList = "";
				index = 1;
				for(var vals in users){
					if(index === userCount){
						cmdUserList += users[vals] + ".";}
						else{
						cmdUserList += users[vals] + ", ";}
					index++;
				}
				io.to(socket.id).emit("command", "Users: " + cmdUserList);
			} else //check if users commands
			if(msg.match(/^([\/]users)/i)){
				var cmdMsg = "";
				if(userCount > 1){
					cmdMsg + "command", "There are " + userCount + " concurrent users.";
				}
					else{
					cmdMsg = "command", "There is " + userCount + " concurrent user.";
				}
				io.to(socket.id).emit("command", cmdMsg);
			} else //default chat message
			{
				io.emit("chat message", "" + users[socket.id], msg);
				history.push(
						{
							"userName": users[socket.id],
							"message": msg
						}
					);
				if(history.length > historyLimit){
					history.shift();
				}
				//console.log(history);
			}
		}
		//socket.broadcast.emit("chat message", msg);
		console.log(users[socket.id] + " - " + msg);
	});
	//on user disconncet
	socket.on("disconnect", function(){
		io.emit("update", users[socket.id] + " has disconnected from the server.");
		console.log(users[socket.id] + " Disconnected.");
		delete users[socket.id];
		userCount = Object.keys(users).length;
	});
});
//emit chat messages
io.emit("some event", {for: "everyone"});

http.listen(port);

console.log("server running at localhost:" + port + "");