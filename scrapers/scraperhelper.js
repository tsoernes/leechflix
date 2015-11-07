var ptn = require('parse-torrent-name')

/*
Extract title, year and the details of the release from a string.
Example: "The Man From U.N.C.L.E 2015 1080p BDRip-Haxx0r" -->
{Title: "The Man From U.N.C.L.E", Year: "2015", rlsDetails: "1080p BDRip-Haxx0r" }
*/
exports.extractInfoFromName = function (name) {
  var parsed = ptn(name)
  var rlsDetails = name.replace(parsed.title, '')
  rlsDetails = rlsDetails.replace(parsed.year, '')
  if (typeof parsed.year === 'undefined') {
    parsed.year = ''
  }
  return ({
    title: parsed.title,
    year: parsed.year.toString(),
    rlsDetails: rlsDetails.trim()
  })
}

exports.sort = function (movies) {
  return sortNoPostersLast(
  sortMoviesByImdbRating(
  sortReleasesBySeeders(movies)))
}

/*
Sort the releases of each movie by the number of seeders in descending
order.
*/
function sortReleasesBySeeders (movies) {
  for (var i = 0 ; i < movies.length; i++) {
    movies[i].release = movies[i].release.sort(function (b, a) {
      return parseFloat(a.seeders) - parseFloat(b.seeders)
    })
  }
  return movies
}

/*
Sort the movies the IMDb rating in descending
order.
*/
function sortMoviesByImdbRating (movies) {
  return movies.sort(function (b, a) {
    if (typeof a.imdbRating === 'undefined' || typeof b.imdbRating === 'undefined') {
      console.log('Tried to sort undefined IMDb ratings')
    }
    return parseFloat(a.imdbRating) - parseFloat(b.imdbRating)
  })
}

function sortNoPostersLast (movies) {
  var withPoster = []
  var noPoster = []
  for (var i = 0; i < movies.length; i++) {
    if (movies[i].imgUrl === null) {
      noPoster.push(movies[i])
    } else {
      withPoster.push(movies[i])
    }
  }
  return withPoster.concat(noPoster)
}
