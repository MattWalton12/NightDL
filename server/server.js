/*
	NightDL
	by Matt Walton, llana digital

	https://matt-walton.net
	https://llana.co
*/

var http = require("http"),
	https = require("https"),
	urlm = require("url"),
	path = require("path"),
	fs = require("fs"),
	express = require("express"),
	config = require("./config.json");

var app = express();
app.use(express.bodyParser());

var downloadList = [];
var dlIndex = 0;

function init() {
	var folderList = fs.readdirSync(__dirname + "/files");
	if (folderList.length > 0) {
		dlIndex = parseInt(Math.max.apply(Math, folderList)) + 1;
	}
}

function addDownload(url, filename) {
	var parsed = urlm.parse(url);
	
	if (!filename)
		filename = path.basename(parsed.pathname);

	var downloadObject = {
		url: url,
		ssl: (parsed.protocol == "https:"),
		filename : filename
	}

	downloadList.push(downloadObject);
}


function downloadFile(url, ssl, file, callback) {
	console.log(ssl);
	var getFunc = (ssl ? https.get : http.get);

	getFunc(url, function(res) {
		if (res.statusCode === 301) {
			var parsed = urlm.parse(res.headers.location);
			downloadFile(res.headers.location, (parsed.protocol == "https:"), file)
		
		} else if (res.statusCode == 200) {

			fs.mkdirSync(__dirname + "/files/" + dlIndex);

			res.on("data", function(d) {
				fs.appendFileSync(__dirname + "/files/" + dlIndex + "/" + file, d);
			});

			res.on("end", function() {
				dlIndex++;
				callback();
			});

		} else {
			callback();
		}
	});
}

function downloadFiles() {
	if (downloadList.length > 0) {
		var dlObject = downloadList[0];
		downloadFile(dlObject.url, dlObject.ssl, dlObject.filename, function() {
			downloadList.splice(0, 1);

			if (downloadList.length == 0) {
				console.log("Downloads complete")
			
			} else {
				downloadFiles()
			}
		});
	}
}

var lastDl = 0;

function checkTime() {
	var d = new Date();
	var splitTime = config.time.split(":");

	if (d.getTime() - lastDl >= 3600) {
		if (d.getHours() == splitTime[0] && d.getMinutes() == splitTime[1]) {
			lastDl = d.getTime();
			downloadFiles();
		}
	}
}

setInterval(checkTime, 5000);

app.get("/add", function(req, res) {
	var url = req.param("url");
	var file = req.param("file");

	if (url) {
		addDownload(url, file);
		res.send(200);
	
	} else {
		res.send(400);
	}
});

app.get("/files", function(req, res) {
	res.end(dlIndex.toString());
});

app.get("/get/:id", function(req, res) {
	if (fs.existsSync(__dirname + "/files/" + req.params.id)) {
		var file = fs.readdirSync(__dirname + "/files/" + req.params.id)[0];
		res.setHeader("Content-Disposition", "attachment; filename=" + file);

		fs.readFile(__dirname + "/files/" + req.params.id + "/" + file, function(err, data) {
			res.end(data);
		});

	} else {
		res.send(404);
	}
});

app.get("/clear", function(req, res) {
	for (i=0; i<dlIndex; i++) {
		fs.unlinkSync(__dirname + "/files/" + i + "/" + fs.readdirSync(__dirname + "/files/" + i)[0]);
		fs.rmdirSync(__dirname + "/files/" + i);
	}

	dlIndex = 0;

	res.send(200);
});

init();
app.listen(1338);