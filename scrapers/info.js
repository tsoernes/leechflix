'use strict'
var async = require('async')
var scraperhelper = require('./scraperhelper.js')
var omdb = require('omdb')

var blankMovie = {
  title: 'Not found in IMDb',
  poster: './static/folder2.jpg',
  imdb: {
    rating: 11,
    votes: 0
  }
}

function getOmdbInfo (show, i, callback) {
  show.type = 'movie'
  // Clean up search term
  omdb.search(show, function (err, movies) {
    if (err) {
      callback(err, null)
    }
    if (movies.length === 0) {
      if (i === 0) {
        // Remove special characters (like - and .) and retry OMDb search
        show.terms = show.terms.replace(/[^a-z0-9\s]/gi, '')
        show.terms = show.terms.replace(/\s+/g, ' ') // Remove multiple whitespace with single space
        getOmdbInfo(show, i + 1, function (err, res) {
          callback(err, res)
        })
        return
      } if (i === 1) {
        // Remove numbers and retry OMDb search
        show.terms = show.terms.replace(/[0-9]/g, '')
        show.terms = show.terms.replace(/\s+/g, ' ') // Remove multiple whitespace with single space
        getOmdbInfo(show, i + 1, function (err, res) {
          callback(err, res)
        })
        return
      } else {
        console.log('No results OMDb: ' + show.terms + ' ' + show.year)
        callback(null, blankMovie)
        return
      }
    } else {
      // @TODO Is there a more intelligent way to select which movie to get? Maybe try the one with the most votes?
      // get(_, true) for extended plot
      omdb.get(movies[0].imdb, true, function (err, movie) {
        if (err) {
          callback(err, null)
          return
        } else {
          if (!movie) {
            console.log('Movie(s) found by search but not by get')
            callback(null, blankMovie)
          }
          // Add whitespace after genres for prettier printing
          if (movie.genres) {
            movie.genres = movie.genres.map(function (s) { return ' ' + s })
            movie.genres[0] = movie.genres[0].substring(1)
          }
          // Sometimes IMDb info is found but it has no rating; set it to 0 to avoid sorting issues
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
        if (err) {
          console.log(searchTerm, err)
          done(err)
        }

        var isCollection = (omdbInfo === blankMovie)

        var movieInfo = {
          isCollection: isCollection,
          title: omdbInfo.title,
          year: omdbInfo.year,
          release: [{
            rlsDetails: movie.name,
            detailsUrl: movie.detailsUrl,
            torrentUrl: movie.torrentUrl,
            size: movie.size,
            seeders: movie.seeders,
            leechers: movie.leechers,
            freeleech: movie.freeleech
          }],
          runtime: omdbInfo.runtime,
          genres: omdbInfo.genres,
          actors: omdbInfo.actors,
          plot: omdbInfo.plot,
          imdbId: omdbInfo.imdb.id,
          imdbRating: omdbInfo.imdb.rating,
          imdbVotes: omdbInfo.imdb.votes,
          imgUrl: omdbInfo.poster,
          hasfreeleech: movie.freeleech
        }

        var added = false
        for (var j = 0; j < results.length; j++) {
          if (results[j].imdbId === movieInfo.imdbId) {
            results[j].release.push(movieInfo.release[0])
            if (movieInfo.release[0].freeleech) results[j].hasfreeleech = true
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
