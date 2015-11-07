var async = require('async')
var scraperhelper = require('./scraperhelper')
var omdb = require('omdb')

function getOmdbInfo (show, i, callback) {
  show.type = 'movie'
  // Clean up search term
  show.terms = show.terms.replace(/720p/ig, '')
  show.terms = show.terms.replace(/1080p/ig, '')
  show.terms = show.terms.replace(/bdrip/ig, '')
  show.terms = show.terms.replace(/imax/ig, '')
  show.terms = show.terms.replace(/unrated/ig, '').trim()
  omdb.search(show, function (err, movies) {
    if (err) {
      callback(err, null)
    }
    if (movies.length === 0) {
      if (i === 0) {
        // Remove special charactes (like - and .) and retry OMDb search
        show.terms = show.terms.replace(/[^a-z0-9\s]/gi, '')
        show.terms = show.terms.replace(/\s+/g, ' ') // Remove multiple whitespace with single space
        getOmdbInfo(show, i + 1, function (err, res) {
          callback(err, res)
        })
        return
      } if (i === 1) {
        // Remove numers and retry OMDb search
        show.terms = show.terms.replace(/[0-9]/g, '')
        getOmdbInfo(show, i + 1, function (err, res) {
          callback(err, res)
        })
        return
      } else {
        console.log('No results OMDb:' + show.terms + ' ' + show.year)
        var notFound = {
          title: 'Not found in IMDb',
          year: '',
          runtime: '',
          actors: '',
          plot: '',
          poster: './static/folder2.jpg',
          imdb: {id: '',
            rating: 11,
            votes: 0}
        }
        callback(null, notFound)
        return
      }
    } else {
      omdb.get(movies[0].imdb, true, function (err, movie) {
        if (err) {
          callback(err, null)
          return
        } else {
          // Add whitespace after genres for prettier printing
          movie.genres = movie.genres.map(function (s) { return ' ' + s })
          movie.genres[0] = movie.genres[0].substring(1)
          // Sometime imdb info is found but it has no rating; set it to 0 to avoid sorting issues
          if (movie.imdb.rating === null) movie.imdb.rating = 0
          callback(null, movie)
        }
      })
    }
  })
}

exports.getInfo = function (movies, callback) {
  var asyncTasks = []
  var results = []

  movies.forEach(function (movie) {
    var info = scraperhelper.extractInfoFromName(movie.name)
    var searchTerm = {terms: info.title, year: info.year}
    asyncTasks.push(function (done) {
      getOmdbInfo(searchTerm, 0, function (err, omdbInfo) {
        var isCollection // Movies not found in OMDb gets collected into one item
        if (err) {
          console.log(err)
          done(err)
        }
        if (omdbInfo.title === 'Not found in IMDb') {
          isCollection = true
          info.rlsDetails = movie.name
        } else {
          isCollection = false
        }

        var movieInfo = {
          isCollection: isCollection,
          title: omdbInfo.title,
          year: omdbInfo.year,
          release: [{
            rlsDetails: info.rlsDetails,
            detailsUrl: movie.detailsUrl,
            torrentUrl: movie.torrentUrl,
            size: movie.size,
            seeders: movie.seeders,
            leechers: movie.leechers
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

        var added = false
        for (var j = 0; j < results.length; j++) {
          if (results[j].imdbId === movieInfo.imdbId) {
            results[j].release.push(movieInfo.release[0])
            added = true
            break
          }
        }
        if (!added) {
          results.push(movieInfo)
        }
        done()
      })
    })
  })

  async.parallel(asyncTasks, function () {
    callback(null, results)
  })
}
