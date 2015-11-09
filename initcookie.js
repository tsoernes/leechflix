var config = require('./config.js')
var fs = require('fs')

// Initialize cookie file which stores the login info
exports.init = function () {
  return new Promise(function (resolve, reject) {
    fs.open(config.cookiePath, 'r', function (err, fd) {
      if (fd) {
        fs.close(fd, function (err) {
          if (err) reject(err)
          else {
            console.log('read cookiefile')
            resolve()
          }
        })
      }
      else if (err.code === 'ENOENT') {
        fs.writeFile(config.cookiePath, '', { flags: 'wx' }, function (err) {
          if (err) reject(err)
          else {
            console.log('wrote cookiefile')
            resolve()
          }
        })
      }
      else {
        reject(err)
      }
    })
  })
}
