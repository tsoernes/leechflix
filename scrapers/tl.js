var config = require('../config.js')
var cheerio = require('cheerio')
var fs = require('fs')
var FileCookieStore = require('tough-cookie-filestore')
var request = require('request')

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

exports.scrapeTorrents = function (url, callback) {
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
      var detailsUrl = 'https://torrentleech.org' + $(this).children().eq(0).attr('href')
      var torrentUrl = 'https://torrentleech.org' + $(this).parent().next().children().eq(0).attr('href')
      var size = $(this).parent().next().next().next().text()
      if (parseInt(size) > config.maxTorrentSize) return
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
