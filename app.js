//requirements
var express 		= require("express")
, app						= express()
, http					= require("http").Server(app)
, io 						= require('socket.io')(http)
, path					= require("path")
, cons 					= require("consolidate")
, MongoClient		= require("mongodb")
, port					= process.env['PORT'] || 3007;
//mongodb variables
var Server = MongoClient.Server;
var Db = MongoClient.Db;
var db = new Db("fcchat", new Server("localhost", 27017));

app.use(express.static(path.join(__dirname, 'public')));
app.locals.db = db;

app.engine("html", cons.swig);
app.set("view engine", "html");
app.set("views", __dirname + "/views");
var webPages = "/views/";

//variables
var users = {};
var rooms = [];
var userCount = 0;
var history = [];
var historyLimit = 300;

//require custom modules
//require room purge function
var purgeRooms = require("./purge-rooms"),
purge = purgeRooms(users, rooms);
//require route functions
var route = require("./routes"),
routeTo = route(__dirname, webPages, users, db);

//socket
//chat server connection
io.on("connection", function(socket){
	var room = socket.handshake.headers.referer;

	socket.on("validate", function(name){
		console.log("running validation...");
		for(var key in users){
			if(users[key].name === name){
				io.to(socket.id).emit("used");
				//console.log(name);
				//console.log("taken");
				name = "";
				return false;
			}
		}
		io.to(socket.id).emit("open");
		//console.log(name);
		//console.log("open");
	});
	socket.on("join", function(name, userRoom){
		if(typeof name === "function" ||
			typeof name === "object" ){
			io.to(socket.id).emit("illegal", "Illegal operation.")
			return false;
		} else
		if(name.length <3 ||
			name.length >14 ||
			name.match(/[\[\]\`\~\|\<\>\s,\?\*\&\^%\$#@!\(\)\\\/\{\}=+\;\:\"\']/ig) ||
			name.match(/[\-\_\.]/ig) &&
			name.match(/[\-\_\.]/ig).length > 1 ){
			name = name.replace(/[<]/ig, "&lt;");
			name = name.replace(/[>]/ig, "&gt;");
			io.to(socket.id).emit("illegal", "Illegal operation.")
			return false;
		} else
		{
			users[socket.id] = {"name": name, "room": room};
			socket.join(room);
			io.in(room).emit("update", users[socket.id].name + " has connected to the server!");
			for(var log in history){
				if(history[log].userName.room === userRoom) {
					io.to(socket.id).emit("chat log", history[log].time, history[log].userName.name, history[log].message);
				}
			}
			var toSub = [];
			for(var vals in users){
				if(users[vals].room === userRoom) {
					toSub.push(users[vals].name);
				}
			}
			toSub = toSub.join(",") + ".";
			io.in(room).emit("user list", toSub);

			userCount = Object.keys(users).length;
			console.log(name + " connected");
			console.log("Users: " + userCount);

			for(var id in users){
				var used = false;
				for(i = 0; i < rooms.length; i++){
					if(users[id].room === rooms[i]){used = true;}
				};
				if(!used){rooms.push(users[id].room);}
			}
		}
	});//end on join
	//on chat msg
	socket.on("chat message", function(msg, userRoom){
		//validate user
		if(!users[socket.id] ){
			return false;
		} else
		{//check script tags
			console.log(typeof msg === "function");
			if(typeof msg === "function" ||
				typeof msg === "object" ){
				//console.log("Snagged scripter.");
				io.to(socket.id).emit("illegal", "Illegal Operation.");
				return false;
			}
			msg = msg.replace(/[<]/ig, "&lt;");
			msg = msg.replace(/[>]/ig, "&gt;");
			//check empty string
			if(msg === ""){
				return false;
			} else
			//check if list command
			if(msg.match(/^([\/]list\b)/i)){
				var cmdUserList = [];
				index = 1;
				for(var vals in users){
					if(users[vals].room === userRoom) {
						cmdUserList.push(users[vals].name);
					}
				}
				cmdUserList = cmdUserList.join(", ") + ".";
				io.to(socket.id).emit("command", "Users: " + cmdUserList);
			} else
			//check if listall command
			if(msg.match(/^([\/]listall)/i)){
				var cmdUserList = [];
				index = 1;
				for(var vals in users){
					cmdUserList.push(users[vals].name);
				}
				cmdUserList = cmdUserList.join(", ") + ".";
				io.to(socket.id).emit("command", "Global Users: " + cmdUserList);
			} else //check if users commands
			if(msg.match(/^([\/]users\b)/i)){
				var cmdMsg = "";
				var count = 0;
				for(var vals in users){
					if(users[vals].room === userRoom) {
						count++;
					}
				}
				if(count > 1){
					cmdMsg = "There are " + count + " concurrent users.";
				}
					else{
					cmdMsg = "There is " + count + " concurrent user.";
				}
				io.to(socket.id).emit("command", cmdMsg);
			} else //check if usersall commands
			if(msg.match(/^([\/]usersall)/i)){
				var cmdMsg = "";
				var count = 0;
				for(var vals in users){
					count++;
				}
				if(count > 1){
					cmdMsg = "There are " + count + " concurrent global users.";
				}
					else{
					cmdMsg = "There is " + count + " concurrent global user.";
				}
				io.to(socket.id).emit("command", cmdMsg);
			} else //check if usersall commands
			if(msg.match(/^([\/]room)\b/i)){
				io.to(socket.id).emit("command", "/" + userRoom.split("/").pop() + "." );
			} else //check if usersall commands
			if(msg.match(/^([\/]roomall)/i)){
				var roomStr = [];
				rooms.map(function(elem) {
					roomStr.push("<a href='" + elem + "'>" + elem.split("/").pop() + "</a>");
				});
				io.to(socket.id).emit("command", "/" + roomStr.join(", ") + "." );
			} else //default chat message
			{
				io.in(room).emit("chat message", users[socket.id].name, msg);
				history.push(
						{
							"userName": users[socket.id],
							"message": msg,
							"time": new Date().getTime()
						}
					);
				if(history.length > historyLimit){
					history.shift();
				}
				//console.log(history);
			}
		}
		console.log(users[socket.id].name + " - " + msg);
	});//end chat message
	//on user disconncet
	socket.on("disconnect", function(){
		if (users[socket.id]){
			io.in(room).emit("update", users[socket.id].name + " has disconnected from the server.");
			console.log(users[socket.id].name + " Disconnected.");
			delete users[socket.id];
			userCount = Object.keys(users).length;
			rooms = purge.p(users, rooms);
			console.log("current rooms: " + rooms);
		}
	});
});
//emit chat messages
io.emit("some event", {for: "everyone"});

//routes
app.get("/", routeTo.landingPage);
app.get("/howTo", routeTo.howTo);
app.get("/goTo", routeTo.goTo);
app.get("/:name", routeTo.chatPage);
app.get("*", routeTo.notFound);

db.open(function(err, db) {
	http.listen(port);
	console.log("server running at localhost:" + port + "");
});