var spawn = require('child_process').spawn
var WebTorrent = require('webtorrent')
var config = require('./config.js')

exports.play = function (torrentFilePath) {
  launchWebtorrent(torrentFilePath)
}

function launchWebtorrent (torrentFilePath) {
  var client = new WebTorrent()
  client.add(torrentFilePath, function ontorrent (torrent) {
    var server = torrent.createServer()
    server.listen(config.port)
    var biggestIdx = 0
    for (var i = 1 ; i < torrent.files.length; i++) {
      if (torrent.files[i].length > torrent.files[biggestIdx].length) {
        biggestIdx = i
      }
    }
    var url = 'http://localhost:' + config.port + '/' + biggestIdx
    console.log(torrent.files[biggestIdx].name + ' available at ' + url)
    launchVideoPlayer(url)
		/*
    @TODO: need to close and destroy when finished wathcing movie
		server.close()
		client.destroy()
		*/
		/*
    @TODO feature: show download progress
		torrent.on('download', function(chunkSize){
		  console.log('chunk size: ' + chunkSize);
		  console.log('total downloaded: ' + torrent.downloaded);
		  console.log('download speed: ' + torrent.downloadSpeed());
		  console.log('progress: ' + torrent.progress);
		  console.log('======');
		  })
  		*/
  })
}

function launchVideoPlayer (url) {
  /*
  @TODO feature: remember playing position and resume there
  /start ms		Start playing at "ms" (= milliseconds)
  /startpos hh:mm:ss	Start playing at position hh:mm:ss
  */
  var child = spawn(config.players.mpchc, [url, '/play'])
  child.on('error', function (err) {
    console.log('Failed to start child process: ' + err)
  })
}

function launchPeerflix (torrentFilePath) {
  var args = '--mpchc'
  var child = spawn('cmd', ['/c', 'peerflix', torrentFilePath, args])
  child.on('error', function (err) {
    console.log('Failed to start child process: ' + err)
  })
}
