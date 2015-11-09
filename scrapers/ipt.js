'use strict'
var config = require('../config.js')
var cheerio = require('cheerio')
var FileCookieStore = require('tough-cookie-filestore')
var request = require('request')
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
    var x = $('table.torrents')
    $('tr', x).each(function (i, element) {
      if (i === 0) {
        // The first element is table description
        return
      }
      var name = $('a.t_title', this).text()
      var detailsUrl = 'https://www.iptorrents.com' + $('a.t_title', this).attr('href')
      var torrentUrl = 'https://www.iptorrents.com' + $('td.ac', this).eq(1).children().eq(0).attr('href')
      // var info = $('div.ar.t_ctime', this).text() // imdb rating, year, genres .. could be useful
      var size = $('td.ac', this).eq(3).text()
      if (parseInt(size) > config.maxTorrentSize) return
      var seeders = $('td.ac.t_seeders', this).text()
      var leechers = $('td.ac.t_leechers', this).text()
      var fleech = $('span.t_tag_free_leech', this).text()
      var freeleech = (fleech !== '')
      results.push({
        name: name,
        detailsUrl: detailsUrl,
        torrentUrl: torrentUrl,
        size: size,
        seeders: seeders,
        leechers: leechers,
        freeleech: freeleech
      })
    })
    callback(null, results)
  })
}
