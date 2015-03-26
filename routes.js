module.exports = function(dir, pages, mongo) {


	return {
		landingPage: function(req, res) {
			var rooms = [];
			mongo.collection("sessions").find({}, {}).toArray( function(err, doc) {
				console.log(doc);
				//
				doc.map(function(elem) {
					var registered = false;
					for(i = 0; i < rooms.length; i++) {
						if(rooms[i] === elem.room) {
							registered = true;
						}
					}
					if(!registered) {
						rooms.push(elem.room);
					}
				});
				
			});			
			var sessSet = req.cookies["express:sess"],
			sign = "signout",
			signText = "Sign Out";
			mongo.collection("sessions").findOne({"_id": sessSet}, function(err, doc) {
				if (err) throw err;
				//console.log(doc["_id"]);
				//console.log(sessSet);
				if(sessSet !== doc["_id"]){
					sign = "signin";
					signText = "Sign In";
				}
				res.setHeader("Content-Type", "text/html");
				res.render("index", {"fail": "", "rooms": rooms, "sign": sign, "signText": signText });
			});
		},
		test: function(req, res) {
			res.setHeader("Content-Type", "text/html");
			res.render("test", {"msg": req.user});
		},
		signUp: function(req, res) {
			res.setHeader("Content-Type", "text/html");
			res.sendFile(dir + pages + "signup.html");
		},
		signIn: function(req, res) {
			res.setHeader("Content-Type", "text/html");
			res.sendFile(dir + pages + "signin.html");
		},
		auth: function(req, res) {
			var userReq = req.body.username;
			var passReq = req.body.password;
			var sessSet = req.cookies["express:sess"];

			mongo.collection("users").findOne({"username": userReq.toLowerCase(), "password": passReq}, function(err, doc) {
				if (err) throw err;
				//console.log(doc);
				if(doc && sessSet) {
					mongo.collection("sessions").insert({"_id": sessSet, "username": userReq, "room": null });
					res.cookie("session-key", sessSet)
					res.redirect("/");
				} else {
					res.redirect("/login");
				}
			});
		},
		howTo: function(req, res) {
			res.setHeader("Content-Type", "text/html");
			res.cookie("user", null);
			res.sendFile(dir + pages + "info.html");
		},
		goTo: function(req, res) {
			console.log(req.query);
			res.setHeader("Content-Type", "text/html");
			if( !req.query.room.match(/[\[\]\`\~\|\<\>\s,\?\*\&\^%\$#@!\(\)\\\/\{\}=+\;\:\"\'_.]/gi) ) {
				var urlRoom = req.query.room.toLowerCase()
				res.redirect("/room/" + urlRoom );
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