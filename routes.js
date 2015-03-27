var bcrypt = require("bcrypt-nodejs");

module.exports = function(dir, pages, mongo) {
	return {
		landingPage: function(req, res) {
			var rooms = [];
			mongo.collection("sessions").find({}).toArray( function(err, doc) {
				//console.log(doc);
				//
				if(doc) {
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
				}				
			});
			//console.log("from req: " + req.cookies["express:sess"]);
			var sessSet = req.cookies["express:sess"],
			sign = "login",
			signText = "Sign In",
			signUp = "",
			user = "";
			//console.log("from sessSet: " + sessSet);
			mongo.collection("sessions").findOne({"_id": sessSet}, function(err, doc) {
				if (err) throw err;

				if(doc && sessSet === doc["_id"]){
					sign = "signout";
					signText = "Sign Out";
					signUp = "disabled";
					user = ", " + doc.username + ",";
				}
				res.setHeader("Content-Type", "text/html");
				res.render("index", {"fail": "", "rooms": rooms, "sign": sign, "signText": signText, "signup": signUp, "user": user });
			});
		},
		test: function(req, res) {
			res.setHeader("Content-Type", "text/html");
			res.render("test", {"msg": req.user});
		},
		signUp: function(req, res) {
			res.setHeader("Content-Type", "text/html");
			res.render("signup", {"errMsg": ""});
		},
		login: function(req, res) {
			res.setHeader("Content-Type", "text/html");
			res.render("signin", {"errMsg": ""});
		},
		signOut: function(req, res) {
			res.setHeader("Content-Type", "text/html");
			var sessSet = req.cookies["express:sess"];
			mongo.collection("sessions").remove({"_id": sessSet});
			res.clearCookie("session-key");
			res.redirect("/");
		},
		insert: function(req, res) {
			var userReq  = req.body.username;
			var passReq  = req.body.password;
			var passReq2 = req.body.password2;
			if(userReq && passReq && passReq2) {
				if (userReq.length < 3 ||
						userReq.length > 14 ||
						userReq.match(/[\[\]\`\~\|\<\>\s,\?\*\&\^%\$#@!\(\)\\\/\{\}=+\;\:\"\']/ig) ||
						userReq.match(/[\-\_\.]/ig) &&
						userReq.match(/[\-\_\.]/ig).length > 1 ) {
					res.render("signup", {"errMsg": "Please enter a valid username."});
				} else
				if (passReq !== passReq2) {
					res.render("signup", {"errMsg": "Passwords to not match"});
				} else {
					mongo.collection("users").findOne({"username": userReq.toLowerCase()}, function(err, doc) {
						if (err) throw err;
						if(!doc) {
							bcrypt.hash(passReq, null, null, function(err, hash) {
								if(err) throw err;
								mongo.collection("users").insert({"username": userReq, "password": hash });
								res.redirect("/");
							});
						} else {
							res.render("signup", {"errMsg": "That username has been taken."});
						}
					});
				}
			} else {
				res.render("signup", {"errMsg": "Please enter your user credentials."});
			}
		},
		auth: function(req, res) {
			var userReq = req.body.username;
			var passReq = req.body.password;
			var sessSet = req.cookies["express:sess"];
			mongo.collection("users").findOne({"username": userReq.toLowerCase()}, function(err, doc) {
				if (err) throw err;
				if(doc && sessSet) {
					bcrypt.compare(passReq, doc.password, function(err, resp) {
					  // res === true
					  if(resp) {
							mongo.collection("sessions").insert({"_id": sessSet, "username": userReq, "room": null });
							res.cookie("session-key", sessSet);
							res.redirect("/");
					  } else {
							res.render("signin", {"errMsg": "Incorrect password."});  	
					  }
					});
				} else {
					res.render("signin", {"errMsg": "Username not found."});
				}
			});
		},
		howTo: function(req, res) {
			res.setHeader("Content-Type", "text/html");
			res.sendFile(dir + pages + "info.html");
		},
		goTo: function(req, res) {
			console.log(req.body.room );
			res.setHeader("Content-Type", "text/html");
			if( !req.body.room.match(/[\[\]\`\~\|\<\>\s,\?\*\&\^%\$#@!\(\)\\\/\{\}=+\;\:\"\'_.]/gi) ) {
				var urlRoom = req.body.room.toLowerCase();
				res.redirect("/room/" + urlRoom );
			} else {
				res.redirect("/");
			}
		},
		chatPage: function(req, res) {
			var sessSet = req.cookies["express:sess"];
			//var urlRoom = req.query.room.toLowerCase();
			mongo.collection("sessions").findOne({"_id": sessSet}, function(err, doc) {
				if (err) throw err;
					//console.log(req.route.path);
					//console.log(req.headers.host);
				if(doc) {
					res.setHeader("Content-Type", "text/html");
					res.render("chat", {"username": doc.username, "room": req.params.name.split("/").pop() });
				} else {
					res.setHeader("Content-Type", "text/html");
					res.redirect("/login");
				}
			});
		},
		notFound: function(req, res) {
			res.setHeader("Content-Type", "text/html");
			res.sendFile(dir + pages + "notfound.html", 404);
		}
	};
}