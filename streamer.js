'use strict'
var spawn = require('child_process').spawn
var WebTorrent = require('webtorrent')
var peerflix = require('peerflix')
var config = require('./config.js')
var fs = require("fs")
var server, client

exports.play = function (torrentFilePath) {
  launchPeerflix(torrentFilePath)
}

function launchVideoPlayer (url) {
  var child = spawn(config.players.vlc, [url])
  child.on('error', function (err) {
    console.log('Failed to start child process: ' + err)
  })
  child.on('exit', function () {
    console.log('exit video player')
    //server.close()
    //client.destroy()
  })
}

function launchPeerflix (torrentFilePath) {
  var engine = peerflix(fs.readFileSync(torrentFilePath))
  engine.server.once('listening', function() {
      var url = "http://localhost:" + engine.server.address().port
      console.log('started webserver on address ' + url)
      launchVideoPlayer(url)
  })

  //@TODO feature: show download progress
  // engine.swarm.downloaded
}
