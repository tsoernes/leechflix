'use strict'
var scraperhelper = require('./scraperhelper.js')
var config = require('../config.js')
var fs = require('fs')
var FileCookieStore = require('tough-cookie-filestore')
var request = require('request')
var async = require('async')
var movieinfo = require('./info.js')
var j = request.jar(new FileCookieStore(config.cookiePath))
request = request.defaults({ jar: j })

exports.login = function (url, credentials, callback) {
  request.post({
    uri: url,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: require('querystring').stringify(credentials)
  }, function (err, res, body) {
    if (err) {
      console.log(err)
      callback(err)
    } else {
      console.log("Logged in at: " + url)
      callback()
    }
  })
}

/*
Scrape torrents from a site with a list of torrents, then find OMDb info about
these torrents, then sort the result
*/
exports.fetch = function (url, scraper, callback) {
  var scraperes, infores, sortres

  async.waterfall([
    function (done) {
      scraper.scrapeTorrents(url, function (err, res) {
        scraperes = res
        console.log('scraped ' + scraperes.length + ' movies from ' + url)
        done(err)
      })
    },
    function (done) {
      movieinfo.getInfo(scraperes, function (err, res) {
        infores = res
        done(err)
      })
    },
    function (done) {
      sortres = scraperhelper.sort(infores)
      done()
    }
  ],
  function (err) {
    if (err) console.log(err)
    callback(err, sortres)
  })
}

/*
Scrape torrents from a search result, assumes all results are the same movie.
Does not retrieve meta info. Sorts the result bases on number of seeders.
*/
exports.fetchReleases = function (url, scraper, callback) {
  var scraperes, sortres

  async.waterfall([
    function (done) {
      scraper.scrapeTorrents(url, function (err, res) {
        scraperes = res
        console.log('scraped ' + scraperes.length + ' movies from ' + url)
        done(err)
      })
    },
    function (done) {
      sortres = scraperhelper.sort(scraperes)
      done()
    }
  ],
  function (err) {
    if (err) console.log(err)
    callback(err, sortres)
  })
}

/*
Download torrent file and save to disk
*/
exports.downloadTorrent = function (url, callback) {
  var dir = config.torrentDir
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
  var filename = url.split('/')
  var path = dir + filename[filename.length - 1]
  request({uri: url})
    .on('error', function (err) {
      console.log('Download torrent err: ' + err + ' for ' + url)
      callback(err, null)
      return
    })
		.pipe(fs.createWriteStream(path))
    .on('close', function () {
      callback(null, path)
    }
  )
}
