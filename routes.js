module.exports = function(dir, pages, users) {

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
			console.log(rooms);
			res.setHeader("Content-Type", "text/html");
			res.render("index.html", {"fail": "", "rooms": rooms });
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