var config = require('./config.js')
var fs = require('fs')

// Initialize cookie file which stores the login info
exports.init = function () {
  return new Promise(function (resolve, reject) {
    try {
      fs.openSync(config.cookiePath, 'r')
      resolve()
    } catch (e) {
      if (e.code === 'ENOENT') {
        // File not found, so make one
        fs.writeFile(config.cookiePath, '', { flags: 'wx' }, function (err) {
          if (err) { reject(err) }
          else { resolve() }
        })
      } else {
        reject(e)
      }
    }
  })
}
