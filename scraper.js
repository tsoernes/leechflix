var request = require('request').defaults({jar: true});
var cheerio = require('cheerio');
var util = require('util');
var fs = require('fs');
var spawn = require('child_process').spawn;
var Q = require('q');
var async = require('async');
var omdb = require('omdb');
var config = require('./config');
var loggedIn = false;

exports.fetch = function(url, callback) {
	login(function (err, data) {
		if (err) {
			console.log(err);
			callback(err, null);
		} else {
			scrapeTorrents(url, function (err, results) {
				if (err) {
					console.log(err);
					callback(err, null);
				} else {
					callback(null, results);
				}
			});
		}
	});
}

exports.play = function(torrentUrl) {
	downloadTorrent(torrentUrl, function(err, path) {
		if (err) {
			console.log(err);
		} else {
			launchPeerflix(path);
		}
	});
}

function login(callback) {
	request.post({
		uri: config.loginUrl,
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: require('querystring').stringify(config.credentials)
	}, function(err, res, body){
		if(err) {
			callback(err, null);
			console.log("Login error");
			return;
		}
		console.log("Login successful");
		callback();
	});
}

function scrapeTorrents(url, callback) {
	request(url, function(err, res, body) {
		if(err) {
			callback(err, null);
			console.log("Main scrape error");
			return;
		}
		var $ = cheerio.load(body);
		var results = [];
		var asyncTasks = [];
		$('span.title').each(function(i, element){
			var name 		= $(this).text();
			var detailsUrl 	= $(this).children().eq(0).attr('href');
			var torrentUrl 	= $(this).parent().next().children().eq(0).attr('href');
			var size 		= $(this).parent().next().next().next().text();
			var seeders 	= $(this).parent().next().next().next().next().next().text();
			var leechers 	= $(this).parent().next().next().next().next().next().next().text();
			var info = extractInfoFromName(name);

			// @TODO: do in parallel
			// @TODO add files to a different view if they do not have info or image
			var show = {title: info.title, year: info.year};
			asyncTasks.push(function(callback){
				getOmdbInfo(show, function (err, res) {
					if (err) omdbInfo = {runtime: "", actors: "", plot: "", imdb: {id: "", rating: 0, votes: 0}, poster: ""};
					if (res) {
						omdbInfo = res;
						var movieInfo = {
							title: omdbInfo.title,
							year: omdbInfo.year,
							release: [{
								rlsDetails: info.rlsDetails,
								detailsUrl: detailsUrl,
								torrentUrl: torrentUrl,
								size: size,
								seeders: seeders,
								leechers: leechers
							}],
							runtime: omdbInfo.runtime,
							genres: omdbInfo.genres,
							actors: omdbInfo.actors,
							plot: omdbInfo.plot,
							imdbId: omdbInfo.imdb.id,
							imdbRating: omdbInfo.imdb.rating,
							imdbVotes: omdbInfo.imdb.votes,
							imgUrl: omdbInfo.poster
						}
						var added = false;
						for (var j=0; j<results.length; j++) {
							if (results[j].imdbId == movieInfo.imdbId) {
								results[j].release.push(movieInfo.release[0]);
								// Sort by number of seeders in descending order
								results[j].release = results[j].release.sort(function(b, a) {
					                return parseFloat(a.seeders) - parseFloat(b.seeders);
					            })
								added = true;
								break;
							}
						}
						if (!added) {
							results.push(movieInfo);
						}

					}
					callback();
				});
  			});
		});
		async.parallel(asyncTasks, function(){
			console.log("Scrape main successful");
		  	callback(null, results);
		});
	});
}

function extractInfoFromName(name) {
	function isDigit(c) {
		return ((c >= '0') && (c <= '9'));
	}
	var title = '';
	var year = 0;
	var rlsDetails = '';
	for (var i=0; i<name.length-4; i++) {
		if (isDigit(name[i]) && isDigit(name[i+1]) && isDigit(name[i+2]) && isDigit(name[i+3])) {
			if (name.substring(i,i+3) != '1080') {
				title = name.substring(0, i-1);
				year = name.substring(i,i+4);
				rlsDetails = name.substring(i+5);
				break;
			}
		}
	}
	if (title == '' || year == 0 || year == '') {
		console.log("Could not extract info from " + name);
	}
	return ({
		title: title,
		year: year,
		rlsDetails: rlsDetails
	});
}

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

function downloadTorrent(url, callback) {
	var filename = url.split("/");
	var dir = './torrents/';
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

function getOmdbInfo(show, callback) {
	omdb.get(show, true, function(err, movie) {
		if(err) {
			console.log("Get OMDB info err: " + err + " for "+ show.title + " " + show.year);
			callback(err, null);
		}
		if(!movie) {
			console.log("No OMDB info results for: " + show.title + " " + show.year);
			callback('Movie not found!', null);
		} else {
			callback(null, movie);
		}
	});
}

// Merge different releases of the same movie (same imdb id) into one object
function mergeResults(results, callback) {
	finalRes = [];
	for (var i=0; i<results.size; i++) {

	}
	callback(null, finalRes);
}

function launchPeerflix(torrentFilePath) {
	// Torrent location is relative to the location of this script
	var child = spawn('cmd', ['/c', 'peerflix', torrentFilePath, "--mpchc"]);
	child.on('error', function (err) {
		console.log('Failed to start child process.');
	});
}
