module.exports = function(dir, pages, users) {
	return {
		landingPage: function(req, res) {
			var rooms = [];
			if(users) {
				for(i = 0; i < rooms.length; i++) {
					var registered = false;
					for(var key in users) {
						if(rooms[i] === users[key].room) {
							registered = true;
						}
					}
					if(!registered) {
						rooms.push(users[key].room);
					}				
				}
			}
			res.setHeader("Content-Type", "text/html");
			res.render("index", {"fail": "", "rooms": rooms});
		},
		howTo: function(req, res) {
			res.setHeader("Content-Type", "text/html");
			res.sendFile(dir + pages + "info.html");
		},
		goTo: function(req, res) {
			res.setHeader("Content-Type", "text/html");
			if( !req.query.room.match(/[\[\]\`\~\|\<\>\s,\?\*\&\^%\$#@!\(\)\\\/\{\}=+\;\:\"\'_.]/gi) ) {
				var urlRoom = req.query.room.toLowerCase();
				res.redirect("/" + urlRoom );
			} else {
				res.redirect("/");
			}
		},
		chatPage: function(req, res) {
			res.setHeader("Content-Type", "text/html");
			res.render("chat");
		},
		notFound: function(req, res) {
			res.setHeader("Content-Type", "text/html");
			res.sendFile(dir + pages + "notfound.html", 404);
		}
	};
}