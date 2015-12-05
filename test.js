var fs = require('fs')
var pt = require('parse-torrent')
//var bencode = require('bencode')
var path = 'C:\\Users\\Torstein\\Downloads\\' + 'Fargo.S02E08.720p.HDTV.x264-FLEET.torrent'
var parsed = pt(fs.readFileSync(path))
//console.log(Object.keys(bencode.decode(fs.readFileSync(path))))
//console.log(Object.keys(bencode.decode(fs.readFileSync(path)).info))
var uri = pt.toMagnetURI(parsed)
console.log(uri)
