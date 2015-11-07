var scraperhelper = require('./scraperhelper.js')
var config = require('../config.js')
var cheerio = require('cheerio')
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

/*
Requires login
*/
exports.fetch = function (url, callback) {
  var scraperes
  var infores
  var sortres

  async.waterfall([
    function (done) {
      scrapeTorrents(url, function (err, res) {
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

exports.login = function (callback) {
  request.post({
    uri: config.urls.login,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: require('querystring').stringify(config.credentials)
  }, function (err, res, body) {
    if (err) {
      console.log('Login error: ' + err)
      callback(err)
    } else {
      console.log('Login successful')
      callback()
    }
  })
}

function scrapeTorrents (url, callback) {
  request(url, function (err, res, body) {
    if (err) {
      console.log('Error scraping ' + url + ': ' + err)
      callback(err, null)
      return
    }
    var $ = cheerio.load(body)
    var results = []
    $('span.title').each(function (i, element) {
      var name = $(this).text()
      var detailsUrl = $(this).children().eq(0).attr('href')
      var torrentUrl = $(this).parent().next().children().eq(0).attr('href')
      var size = $(this).parent().next().next().next().text()
      var seeders = $(this).parent().next().next().next().next().next().text()
      var leechers = $(this).parent().next().next().next().next().next().next().text()
      results.push({
        name: name,
        detailsUrl: detailsUrl,
        torrentUrl: torrentUrl,
        size: size,
        seeders: seeders,
        leechers: leechers
      })
    })
    callback(null, results)
  })
}

exports.downloadTorrent = function (url, callback) {
  var dir = config.torrentDir
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
  var filename = url.split('/')
  var path = dir + filename[filename.length - 1]
  var uri = 'http://torrentleech.org' + url
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
