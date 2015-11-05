var scraperhelper = require('./scraperhelper.js');
var cheerio = require('cheerio');
var util = require('util');
var fs = require('fs');
var Q = require('q');
var async = require('async');
var omdb = require('omdb');
var config = require('./config');
var FileCookieStore = require('tough-cookie-filestore');
var request = require('request');

/*
Initialize cookie file which store the login info
*/
try {
	fs.openSync(config.cookiePath, 'r');
} catch (e) {
	if (e.code === 'ENOENT') {
		// File not found, so make one
		fs.writeFileSync(config.cookiePath, "", { flags: 'wx' }, function (err) {
		    if (err) {
				console.log(err);
				throw err;
			}
		});
	} else {
		console.log(e);
  		throw e;
	}
}

var j = request.jar(new FileCookieStore(config.cookiePath));
request = request.defaults({ jar : j });


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
					callback(null,
						scraperhelper.sortMoviesByImdbRating(
							scraperhelper.sortReleasesBySeeders(results)));
				}
			});
		}
	});
}


/*
Check if the stored cookie is valid, and logs in if not
*/
function checkLogin(callback) {
	var cookie = j.getCookies('http://torrentleech.org');
	if (typeof cookie == "undefined" || cookie.length == 0 ) {
		login(function(err, res) {
			callback(err, res);
		});
	}

}

function login(callback) {
	request.post({
		uri: config.urls.login,
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: require('querystring').stringify(config.credentials)
	}, function(err, res, body){
		if(err) {
			console.log("Login error");
			callback(err, null);
			return;
		} else {
			console.log("Login successful");
			callback(null, body);
		}
	});
}

function scrapeTorrents(url, callback) {
	request(url, function(err, res, body) {
		if(err) {
			console.log("Error scraping: " + url);
			callback(err, null);
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
			var info = scraperhelper.extractInfoFromName(name);

			// @TODO add files to a different view if they do not have info or image
			var searchTerm = {title: info.title, year: info.year};
			asyncTasks.push(function(callback){
				getOmdbInfo(searchTerm, function (err, res) {
					if (err) {
						var isCollection = true;
						info.rlsDetails = name;
						omdbInfo = {title: "Not found in IMDb", runtime: "", actors: "", plot: "", imdb: {id: "", rating: 10, votes: 0}, poster: "../static/folder2.jpg"};
					} else {
						omdbInfo = res;
						var isCollection = false;
					}

					var movieInfo = {
						isCollection: isCollection,
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
							added = true;
							break;
						}
					}
					if (!added) {
						results.push(movieInfo);
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
