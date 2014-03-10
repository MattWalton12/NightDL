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
app.configure(function() {
	app.use(express.urlencoded());
	app.use(config.baseurl + "/static", express.static(__dirname + "/static"))
	app.set("view engine", "ejs");
});

var baseurl = config.baseurl;

if (config.baseurl == "") {
	baseurl = "/";
}

var downloadList = [];
var dlIndex = 0;
var dlID = 0;

function init() {
	if (!fs.existsSync(__dirname + "/files"))
		fs.mkdirSync(__dirname + "/files");

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
		filename : filename,
		id : dlID
	}

	dlID++;

	downloadList.push(downloadObject);
}


function downloadFile(url, ssl, file, callback) {
	var getFunc = (ssl ? https.get : http.get);

	getFunc(url, function(res) {
		if (res.statusCode === 301) {
			var parsed = urlm.parse(res.headers.location);
			downloadFile(res.headers.location, (parsed.protocol == "https:"), file, downloadCallback)
		
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

function downloadCallback() {
	downloadList.splice(0, 1);

	if (downloadList.length == 0) {
		console.log("Downloads complete")
	
	} else {
		downloadFiles()
	}
}

function downloadFiles() {
	if (downloadList.length > 0) {
		var dlObject = downloadList[0];
		downloadFile(dlObject.url, dlObject.ssl, dlObject.filename, downloadCallback);
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

app.get(baseurl, function(req, res) {
	res.render("index", {files: downloadList, time: config.time, baseurl: config.baseurl})
});
	
app.get(config.baseurl + "/add", function(req, res) {
	var url = req.param("url");
	var file = req.param("file");
	var redirect = req.param("redirect");

	if (url) {
		addDownload(url, file);
		
		if (redirect) {
			res.redirect(config.baseurl);

		} else {
			res.send(200);
		}
	
	} else {
		res.send(400);
	}
});

app.get(config.baseurl + "/remove", function(req, res) {
	var id = parseInt(req.param("id"));
	var redirect = req.param("redirect");

	var done = false;

	if (typeof id == "number") {
		for (var i=0; i<downloadList.length; i++) {
			if (downloadList[i].id === id) {
				downloadList.splice(i, 1);
				done = true;
				
				if (redirect) {
					res.redirect(config.baseurl);

				} else {
					res.send(200);
				}
			}
		}
	}

	if (!done) {
		res.send(404);
	}
});

app.get(config.baseurl + "/files", function(req, res) {
	res.end(dlIndex.toString());
});

app.get(config.baseurl + "/get/:id", function(req, res) {
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

app.get(config.baseurl + "/clear", function(req, res) {
	for (i=0; i<dlIndex; i++) {
		fs.unlinkSync(__dirname + "/files/" + i + "/" + fs.readdirSync(__dirname + "/files/" + i)[0]);
		fs.rmdirSync(__dirname + "/files/" + i);
	}

	dlIndex = 0;

	res.send(200);
});

app.get(config.baseurl + "/list", function(req, res) {
	res.end(JSON.stringify(downloadList));
});

init();
app.listen(config.port);