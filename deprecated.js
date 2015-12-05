function scrapeTorrentDetails(url, callback) {
	request(url, function(err, res, body) {
		if(err) {
			callback(err, null);
			console.log("Detail scrape error");
			return;
		}
		//console.log("Scraping: " + url);
		var $ = cheerio.load(body);
		var torrentUrl = $('#downloadButton').parent().attr('action');
		var tds = $('td');
		var title = $(tds).get(1).firstChild.data;
		var hash = $(tds).get(3).firstChild.data.trim();
		var size = $(tds).get(9).firstChild.data;
		var rlsDate = "";
		var genres = "";
		var runtime = "";
		var plot = "";
		var rating = "";
		var imdb_id = "";
		var imageUrl = "";
		var thumb = "";
		if (tds.length > 23) {
			if ( $(tds).get(23).firstChild != null) {
				rlsDate = $(tds).get(23).firstChild.data || '';
			}
			if ( $(tds).get(27).firstChild != null) {
				genres = $(tds).get(27).firstChild.data || '';
			}
			if ( $(tds).get(31).firstChild != null) {
				runtime = $(tds).get(31).firstChild.data || '';
			}
			if ( $(tds).get(33).firstChild != null) {
				plot = $(tds).get(33).firstChild.data || '';
			}
			rating = $('#imdb_rating').parent().next().text() || ''; // of 10
			if ( $('[name=imdbID]').get(0).attribs != null) {
				imdb_id = $('[name=imdbID]').get(0).attribs.value || '';
			}
			imageUrl = $('#cover').children().eq(0).get(0).attribs.href || '';
		}
		var movie = {
			imdb_id: imdb_id,
			year: rlsDate,
			title: title,
			genre: genres,
			rating: rating,
			synopsis: plot,
			runtime: runtime,
			imageUrl: imageUrl,
			torrentUrl: torrentUrl,
			magnet: 'magnet:?xt=urn:btih:' + hash + '&tr=http://tracker.torrentleech.org:2710/a/daaec160fe1144f9a01ec77260160dfc/announce',
			filesize: size
		};
		callback(null, movie);
	});
}

function downloadImage(show, callback) {
	var filename = show.title + " " + show.year + ".jpg";
	var path = "./images/" + filename;
	// Check if file is already downloded before doing it again
	fs.stat(path, function(err, stat) {
	    if(err == null) {
	        // File exists
			callback(null, path);
	    } else {
			omdb.poster(show)
				.on('error', function(err) {
					console.log("Download OMDB image err: " + err + " for " + show.title + " " + show.year);
					callback(err, null);
					return;
				})
				.pipe(fs.createWriteStream(path))
			    .on('close', function() {
					callback(null, path);
				});
	    }
	});
}

function launchWebtorrent (torrentFilePath) {
  client = new WebTorrent()
  client.add(torrentFilePath, function ontorrent (torrent) {
    server = torrent.createServer()
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
		*/


    //@TODO feature: show download progress
		torrent.on('download', function(chunkSize){
		  console.log('total downloaded: ' + torrent.downloaded);
		  console.log('download speed: ' + torrent.downloadSpeed());
		  console.log('progress: ' + torrent.progress);
		  console.log('======');
		  })
  })
}


function launchTorrentStream (torrentFilePath) {
  var http = require('http')
  var torrentStream = require('torrent-stream')
  var engine = torrentStream(fs.readFileSync(torrentFilePath))

  engine.on('ready', function() {
    var biggestIdx = 0
    for (var i = 1 ; i < engine.files.length; i++) {
      if (engine.files[i].length > engine.files[biggestIdx].length) {
        biggestIdx = i
      }
    }
    var server = http.createServer(function (req, res) {
      var stream = engine.files[biggestIdx].createReadStream();
      res.setHeader('Content-Type', 'video/mp4')
      stream.pipe(res);
    })
    server.listen(config.port, 'localhost');  // start

    var url = 'http://localhost:' + config.port + '/' + biggestIdx
    console.log(engine.files[biggestIdx].name + ' available at ' + url)
  })
}

function spawnPeerflix (torrentFilePath) {
  var args = '--mpchc'
  var child = spawn('cmd', ['/c', 'peerflix', torrentFilePath, args])
  child.on('error', function (err) {
    console.log('Failed to start child process: ' + err)
  })
}
