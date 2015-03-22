module.exports = function(users, rooms) {
	return {
		p: function() {
			var newRooms = [];
			for(var key in users) {
				var match = false;
				for(i = 0; i < rooms.length; i++) {
					if(rooms[i] === users[key].room) {
						console.log(rooms[i] + " === " + users[key].room)
						match = true;
					}
				}
				if(match) {
					newRooms.push(users[key].room);
				}
			}
			rooms = newRooms;
			return rooms;
		//end of purge
		}
	};
}