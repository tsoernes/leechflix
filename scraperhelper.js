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
    rlsDetails: rlsDetails
  })
}

/*
Sort the releases of each movie by the number of seeders in descending
order.
*/
exports.sortReleasesBySeeders = function (movies) {
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
exports.sortMoviesByImdbRating = function (movies) {
  return movies.sort(function (b, a) {
    return parseFloat(a.imdbRating) - parseFloat(b.imdbRating)
  })
}
