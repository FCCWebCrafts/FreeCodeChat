//requirements
var express 		= require("express")
, app						= express()
, http					= require("http").Server(app)
, io 						= require('socket.io')(http)
, path					= require("path")
, cons 					= require("consolidate")
, swig					= require("swig")
, cookieParser	= require("cookie-parser")
, bodyParser		= require("body-parser")
, session				= require("cookie-session")
, MongoClient		= require("mongodb")
, port					= process.env['PORT'] || 3007;

//require login
//var passport = require("./login-data");
//configuration
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(session({
	keys: ["key1", "key2","key3"],
	secret: "secret",
	cookie: {maxAge: 60 * 60 * 1000}
}));
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    next();
}
app.use(allowCrossDomain);
app.engine("html", cons.swig);
app.set("view engine", "html");
app.set("views", __dirname + "/views");
var webPages = "/views/";

//variables
var rooms = [];
userSessions = {},
userCount = 0,
history = [],
historyLimit = 300,
Server = MongoClient.Server,
Db = MongoClient.Db,
db = new Db("fccaht", new Server("localhost", 27017));

//require custom modules
//
//require room purge function
var purgeRooms = require("./purge-rooms"),
purge = purgeRooms(db, rooms);
//
//require route functions
var route = require("./routes"),
routeTo = route(__dirname, webPages, db);

//socket
//chat server connection
io.on("connection", function(socket){
	var room = socket.handshake.headers.referer;
	var sessCookie;
	socket.on("validate", function(sessSet){
		console.log("running validation...");
		db.collection("sessions").findOne({"_id": sessSet}, function(err, doc) {
			//console.log( doc)
			if(!doc){
				io.to(socket.id).emit("signin");
			} else {
				io.to(socket.id).emit("validated", doc["username"]);
				sessCookie = sessSet;
				console.log("cookie: " + sessCookie);
			}
		});
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
			db.collection("sessions").update({"_id": sessCookie}, { $set: { room: userRoom } });
			socket.join(room);
			io.in(room).emit("update", name + " has connected to the server!");
			for(var log in history){
				if(history[log].room === userRoom) {
					io.to(socket.id).emit("chat log", history[log].time, history[log].username, history[log].message);
				}
			}
			db.collection("sessions").find({}).toArray(function(err, doc) {
				if (err) throw err;
				var toSub = [];
				doc.map(function(elem, index){
					if(elem.room === userRoom) {
						toSub.push(elem.username);
					}
				});
				toSub = toSub.join(",") + ".";
				io.in(room).emit("user list", toSub);

				userCount++;
				console.log(name + " connected");
				console.log("Users: " + userCount);

				for(var id in doc){
					var used = false;
					for(i = 0; i < rooms.length; i++){
						if(doc[id].room === rooms[i]){used = true;}
					};
					if(!used){rooms.push(doc[id].room);}
				}
			});
		}
	});//end on join
	//on chat msg
	socket.on("chat message", function(msg, userRoom, name){
	//check script tags
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
			db.collection("sessions").find({}).toArray(function(err, doc) {
				if (err) throw err;
				doc.map(function(elem, index){
					console.log(elem.room);
					if(elem.room === userRoom) {
						cmdUserList.push(elem["username"]);
					}
				});
				cmdUserList = cmdUserList.join(", ") + ".";
				io.to(socket.id).emit("command", "Users: " + cmdUserList);
			});	
		} else
		//check if listall command
		if(msg.match(/^([\/]listall)/i)){
			var cmdUserList = [];
			index = 1;
			db.collection("sessions").find({}).toArray(function(err, doc) {
				if (err) throw err;
				doc.map(function(elem, index){
					cmdUserList.push(elem["username"]);
				});
				cmdUserList = cmdUserList.join(", ") + ".";
				io.to(socket.id).emit("command", "Global Users: " + cmdUserList);
			});	
		} else //check if users commands
		if(msg.match(/^([\/]users\b)/i)){
			var cmdMsg = "";
			var count = 0;
			db.collection("sessions").find({}).toArray(function(err, doc) {
				doc.map(function(elem, index){
					console.log(elem.room === userRoom);
					if(elem.room === userRoom) {
						count++;
					}
				});
				if(count > 1){
					cmdMsg = "There are " + count + " concurrent users.";
				}
					else{
					cmdMsg = "There is " + count + " concurrent user.";
				}
				io.to(socket.id).emit("command", cmdMsg);
			});	
		} else //check if usersall commands
		if(msg.match(/^([\/]usersall)/i)){
			var cmdMsg = "";
			var count = 0;
			db.collection("sessions").find({}).toArray(function(err, doc) {
				doc.map(function(elem, index){
					count++;
				});
				if(count > 1){
					cmdMsg = "There are " + count + " concurrent global users.";
				}
					else{
					cmdMsg = "There is " + count + " concurrent global user.";
				}
				io.to(socket.id).emit("command", cmdMsg);
			});
		} else //check if usersall commands
		if(msg.match(/^([\/]room)\b/i)){
			io.to(socket.id).emit("command", "/" + userRoom.split("/").pop() + "." );
		} else //check if usersall commands
		if(msg.match(/^([\/]roomall)/i)){
			var roomStr = [];
			db.collection("sessions").find({}).toArray(function(err, doc) {
				doc.map(function(elem, index){
					var theRoom = elem.room;
					roomStr.push("<a href='" + theRoom + "'>/" + theRoom.split("/").pop() + "</a>");					
				});
				io.to(socket.id).emit("command", roomStr.join(", ") + "." );
			});
		} else //default chat message
		{
			io.in(room).emit("chat message", name, msg);
			history.push(
					{
						"username": name,
						"message": msg,
						"time": new Date().getTime(),
						"room": room
					}
				);
			if(history.length > historyLimit){
				history.shift();
			}
			//console.log(history);
		}
		console.log(name + " - " + msg);
	});//end chat message
	//on user disconncet
	socket.on("disconnect", function(){
		db.collection("sessions").findOne({"_id": sessCookie}, function(err, doc) {
			if(doc) {
				db.collection("sessions").update({"_id": sessCookie}, { $unset: { room: true } });
				io.in(room).emit("update", doc.username + " has disconnected from the server.");
				console.log(doc.username + " Disconnected.");
				//delete users[socket.id];
				userCount--;
				rooms = purge.p(doc.username);
				console.log("current rooms: " + rooms);				
			}
			//console.log(doc);
		});
	});
});
//emit chat messages
io.emit("some event", {for: "everyone"});

//routes
//get
app.get("/", routeTo.landingPage);
app.get("/room", routeTo.landingPage);
app.get("/login", routeTo.login);
app.get("/signup", routeTo.signUp);
app.get("/signout", routeTo.signOut);
app.get("/howTo", routeTo.howTo);
app.get("/room/:name", routeTo.chatPage);
app.get("*", routeTo.notFound);
//post
app.post("/goTo", routeTo.goTo);
app.post("/login", routeTo.auth);
app.post("/signup", routeTo.insert);

db.open(function(err, db) {
	http.listen(port);
	console.log("server running at port:" + port + "");
});