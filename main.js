var gui = require('nw.gui')
var swig = require('swig')
var fs = require('fs')
var tlscraper = require('./scrapers/tl.js')
var streamer = require('./streamer.js')
var config = require('./config.js')
var async = require('async')
var appTemplate = swig.compileFile('./templates/app.html')
var movieLibraryTemplate = swig.compileFile('./templates/movieLibrary.html')
var movieDetails = swig.compileFile('./templates/movieDetails.html')

var currentMovies
var currentUrl

function start () {
  initCore(function () {
    currentUrl = config.urls.moviesNew
    fetch(currentUrl)
  })
}

function initCore (callback) {
  async.series([
    function (done) {
      tlscraper.login(function (err) {
        done(err)
      })
    }
  ], function (err) {
    callback(err)
  })
}

function fetch () {
  tlscraper.fetch(currentUrl, function (err, res) {
    if (err) {
      console.log('err' + err)
    } else {
      currentMovies = res
      sendItemsToView()
    }
  })
}

function play (torrentUrl) {
  tlscraper.downloadTorrent(torrentUrl, function (err, path) {
    if (err) console.log(err)
    else streamer.play(path)
  })
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
  24HOURS, 7DAYS, 2MONTHS, 1YEAR (weeks not working..?)
  */
  currentUrl = config.urls.moviesPopBeg + term + config.urls.moviesPopEnd
  fetch()
}

function goNewPage () {
  currentUrl = config.urls.moviesNew
  fetch()
}
