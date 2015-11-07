var scraperhelper = require('./scraperhelper.js')
var config = require('../config.js')
var fs = require('fs')
var FileCookieStore = require('tough-cookie-filestore')
var request = require('request')
var async = require('async')
var movieinfo = require('./info.js')

// Initialize cookie file which stores the login info
try {
  fs.openSync(config.cookiePath, 'r')
} catch (e) {
  if (e.code === 'ENOENT') {
    // File not found, so make one
    fs.writeFileSync(config.cookiePath, '', { flags: 'wx' }, function (err) {
      if (err) { throw (err) }
    })
  } else {
    throw (e)
  }
}
var j = request.jar(new FileCookieStore(config.cookiePath))
request = request.defaults({ jar: j })

exports.login = function (url, credentials, callback) {
  request.post({
    uri: url,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: require('querystring').stringify(credentials)
  }, function (err, res, body) {
    if (err) {
      callback(err)
    } else {
      callback()
    }
  })
}

exports.fetch = function (url, scraper, callback) {
  var scraperes
  var infores
  var sortres

  async.waterfall([
    function (done) {
      scraper.scrapeTorrents(url, function (err, res) {
        scraperes = res
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
    callback(err, sortres)
  })
}

exports.downloadTorrent = function (url, callback) {
  var dir = config.torrentDir
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
  var filename = url.split('/')
  var path = dir + filename[filename.length - 1]
  var uri = config.urls.tl.main + url
  request({uri: uri})
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
