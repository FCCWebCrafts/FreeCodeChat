module.exports = function(dir, pages, users, mongo) {
var url = "mongodb://localhost:27017/fcchat";

	return {
		landingPage: function(req, res) {
			var rooms = [];
			for(var key in users) {
				var registered = false;
				for(i = 0; i < rooms.length; i++) {
					if(rooms[i] === users[key].room) {
						registered = true;
					}
				}
				if(!registered) {
					rooms.push(users[key].room);
				}
			}
			mongo.collection("urls").find({}, {"_id": 0, "urls": /9$/},{}).toArray(function(err, doc) {
				if (err) throw err;
				var arr = [];
				doc.map(function(elem) {
					arr.push(elem.urls);
				});
				console.log( arr );
				res.setHeader("Content-Type", "text/html");
				res.render("index.html", {"fail": "", "rooms": arr });
			});
		},
		howTo: function(req, res) {
			res.setHeader("Content-Type", "text/html");
			res.sendFile(dir + pages + "info.html");
		},
		goTo: function(req, res) {
			console.log(req.query);
			res.setHeader("Content-Type", "text/html");
			if( !req.query.room.match(/[\[\]\`\~\|\<\>\s,\?\*\&\^%\$#@!\(\)\\\/\{\}=+\;\:\"\'_.]/gi) ) {
				res.redirect("http://" + req.headers.host + "/" + req.query.room.toLowerCase() );
			} else {
				res.render("index", {"fail": "please enter a valid room name."} );
			}
		},
		chatPage: function(req, res) {
			res.setHeader("Content-Type", "text/html");
			res.sendFile(dir + pages + "chat.html");
		},
		notFound: function(req, res) {
			res.setHeader("Content-Type", "text/html");
			res.sendFile(dir + pages + "notfound.html", 404);
		}
	};
}