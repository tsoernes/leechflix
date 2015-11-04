var spawn = require('child_process').spawn;
var config = require('./config');

exports.play = function(torrentUrl) {
	downloadTorrent(torrentUrl, function(err, path) {
		if (err) {
			console.log(err);
		} else {
			launchPeerflix(path);
		}
	});
}

function downloadTorrent(url, callback) {
	var filename = url.split("/");
    var dir = config.torrentDir;
	if (!fs.existsSync(dir)){
	    fs.mkdirSync(dir);
	}
	var path = dir + filename[filename.length - 1];
	var url = "http://torrentleech.org" + url;
	request({uri: url})
		.on('error', function(err) {
			console.log("Download torrent err: " + err + " for " + url);
			callback(err, null);
			return;
		})
		.pipe(fs.createWriteStream(path))
      	.on('close', function() {
        	callback(null, path);
    	}
	);
}

function launchPeerflix(torrentFilePath, args) {
	// Torrent location is relative to the location of this script
    if (typeof args == "undefined" || args = "") {
        args = "--mpchc";
    }
	var child = spawn('cmd', ['/c', 'peerflix', torrentFilePath, args]);
	child.on('error', function (err) {
		console.log('Failed to start child process.');
	});
}
