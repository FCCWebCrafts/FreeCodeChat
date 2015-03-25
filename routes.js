module.exports = function(dir, pages, users, mongo, sess) {


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
			var sessSet = req.cookies["express:sess"];
			var signedIn;
			if(sess[sessSet].username){
				signedIn = true;
			}
			res.setHeader("Content-Type", "text/html");
			res.render("index.html", {"fail": "", "rooms": rooms, "signedIn": signedIn });
			console.log(sess);
		},
		test: function(req, res) {
			res.setHeader("Content-Type", "text/html");
			res.render("test.html", {"msg": req.user});
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
				console.log(doc);
				if(doc && sessSet) {
					console.log(sessSet);
					res.redirect("/");
					sess = sess;
					sess[sessSet] = { "username": userReq};
					return sess;
				} else {
					res.redirect("/signin");
				}
			})
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
				var url = "http://" + req.headers.host + "/" + req.query.room.toLowerCase()
				res.redirect(url);
			} else {
				res.render("index", {"fail": "please enter a valid room name."} );
			}
		},
		chatPage: function(req, res) {
			console.log(req.cookies);
			console.log(req.sessionCookies.request.signedCookies );
			res.setHeader("Content-Type", "text/html");
			res.sendFile(dir + pages + "chat.html");
		},
		notFound: function(req, res) {
			res.setHeader("Content-Type", "text/html");
			res.sendFile(dir + pages + "notfound.html", 404);
		}
	};
}