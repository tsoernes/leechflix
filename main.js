var gui = require('nw.gui')
var scraper = require('../scraper.js')
var config = require('../config.js')
var swig = require('swig')

var appTemplate = swig.compileFile('templates/app.html')
var movieLibraryTemplate = swig.compileFile('templates/movieLibrary.html')
var movieDetails = swig.compileFile('templates/movieDetails.html')

var currentMovies
var currentUrl

function start () {
  currentUrl = config.urls.moviesNew
  fetch(currentUrl)
}

function fetch () {
  scraper.fetch(currentUrl, function (err, res) {
    if (err) {
      console.log('err' + err)
    } else {
      currentMovies = res
      sendItemsToView()
    }
  })
}

function play (torrentUrl) {
  scraper.play(torrentUrl)
}

function sendItemsToView () {
  document.body.innerHTML = (appTemplate())
  if (currentMovies !== null) {
    document.getElementById('movieLibrary_content').innerHTML = (movieLibraryTemplate({movies: currentMovies}))
  } else {
    document.getElementById('movieLibrary_content').innerHTML = ''
  }
  initUI()
}

function initUI () {
  $('#overlayMovie').easyModal()
}

function showMovieOverlay (position) {
  var movie = currentMovies[position]
  document.getElementById('overlayMovie').innerHTML = (movieDetails({movie: movie}))
  $('#overlayMovie').trigger('openModal')
}

function getSearchUrl (term) {
  return config.urls.searchBeg + term.replace(' ', '+') + config.urls.searchEnd
}

function openLink (link) {
  gui.Shell.openExternal(link)
}

/*
Page navigation
*/

function goNextPage () {
  var index = parseInt(currentUrl.substring(currentUrl.length - 1, currentUrl.length)) + 1
  currentUrl = currentUrl.substring(0, currentUrl.length - 1) + index.toString()
  fetch()
}

function goPrevPage () {
  var index = parseInt(currentUrl.substring(currentUrl.length - 1, currentUrl.length))
  if (index > 1) {
    index = index - 1
    currentUrl = currentUrl.substring(0, currentUrl.length - 1) + index.toString()
    fetch()
  }
}

/*
Browse most popular movies added in the given timeframe
*/
function goPopPage (term) {
  /*
  Example valid terms:
  24HOURS, 1WEEK, 1WEEKS, 2MONTHS, 1YEAR
  */
  currentUrl = config.urls.moviesPopBeg + term + config.urls.moviesPopEnd
  fetch()
}
