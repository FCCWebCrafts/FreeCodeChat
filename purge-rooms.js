module.exports = function(mongo, rooms) {
	return {
		p: function(user) {
			var newRooms = [];
			db.collection("sessions").find({}).toArray( function(err, doc) {
				if (err) throw err;
				doc.map(function(elem, index) {
					var match = false;
					for(i = 0; i < rooms.length; i++) {
						if(rooms[i] === elem.room) {
							//console.log(rooms[i] + " === " + elem.room)
							match = true;
						}
					}
					if(match) {
						newRooms.push(elem.room);
					}
				});
			})
		return rooms;
		//end of purge
		}
	};
}