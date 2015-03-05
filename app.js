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

//chat server connection
io.on("connection", function(socket){
	socket.on("join", function(name){
		users[socket.id] = name;
		io.emit("update", users[socket.id] + " has connected to the server!");
		userCount = Object.keys(users).length;
		console.log(name + " connected");
		console.log("Users: " + userCount);
	});
	//on chat msg
	socket.on("chat message", function(msg){
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
			io.emit("command", "Users: " + cmdUserList);
		} else //check if users commands
		if(msg.match(/^([\/]users)/i)){
			if(userCount > 1){
				io.emit("command", "There are " + userCount + " concurrent users.");
			}
				else{
				io.emit("command", "There is " + userCount + " concurrent user.");
			}
		} else //default chat message
		{
			io.emit("chat message", "" + users[socket.id], msg);
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