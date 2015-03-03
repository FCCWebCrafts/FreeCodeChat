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
app.get("/", index);;
app.get("/chat", chatPage);
//socket
// connection and chat receiving.
io.on("connection", function(socket){
	console.log("User connected");
	//on chat msg
	socket.on("chat message", function(msg){
		io.emit("chat message", msg);
		//socket.broadcast.emit("chat message", msg);
		console.log("User - " + msg);
	});
	//on user disconncet
	socket.on("disconnect", function(){
		console.log("User Disconnected");
	});
});
//emit chat messages
io.emit("some event", {for: "everyone"});

http.listen(port);

console.log("server running at localhost:" + port + "");