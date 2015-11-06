var fs = require('fs')
var omdb = require('omdb')

function getShow () {
  var show = { terms: 'limitless', type: 'series' }
  omdb.search(show, function (err, movie) {
    if (err) {
      return console.error(err)
    }
    if (!movie) {
      return console.log('Movie not found!')
    }

    console.log(movie)
    omdb.get(movie[0].imdb, function (err, res) {
      console.log(err + res)
    })
    var filename = 'test2.jpg'
    var path = filename
    omdb.poster(movie[0].imdb)
      .pipe(fs.createWriteStream(path))
      .on('close', function () {})
  })
}

function getMovie () {
  var show = {terms: 'asd', year: '', type: 'movie', specialChars: true}
  show.terms = show.terms.replace(/[^a-z0-9\s]/gi, '') // Remove special characters for improved search
  show.terms = show.terms.replace(/\s+/g, ' ') // Remove multiple white-spaces which may arise from the previous replace
  show.terms = show.terms.trim()
  if (typeof show.year !== 'undefined') {
    show.year = show.year.replace(/\s+/g, '')
  }
  console.log(show)
  omdb.search(show, function (err, movies) {
    if (err) {
      return console.error(err)
    }
    if (!movies || movies.length === 0) {
      return console.log('No search results')
    } else {
      console.log(movies)
      omdb.get(movies[0].imdb, true, function (err, movie) {
        if (err) {
          return console.error(err)
        }
        if (!movie) {
          return console.log('Movie not found!')
        }

        console.log(movie)
        var filename = './images/' + movie.title + '.jpg'
        var path = filename
        omdb.poster(movie.imdb.id)
          .on('error', function (err) {
            console.log('Poster err: ' + err)
            return
          })
          .pipe(fs.createWriteStream(path))
          .on('close', function () {})
      })
    }
  })
}

function parseName () {
  var ptn = require('parse-torrent-name')
  var name = 'Mission Impossible Rogue Nation BD25 Re-Encoded 1080p Blu-ray AVC DTS-HD MA 7 1-SLHD'
  console.log(ptn(name).title)
}

getMovie()
