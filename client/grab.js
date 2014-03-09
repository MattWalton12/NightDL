var http = require("http"),
	config = require("./client-config.json"),
	fs = require("fs");

http.get(config.url + "/files", function(res) {
	res.on("data", function(data) {
		for (var i=0; i<files; i++) {
			console.log("fetching file");
			http.get(config.url + "/get/" + i, function(res) {
				var filename = res.headers['content-disposition'].split("; filename=")[1];
				console.log(filename);
				res.on("data", function(d) {
					fs.appendFileSync(config.location + "/" + filename, d)
				});
			});
		}
	});
});