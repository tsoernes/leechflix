var omdb = require('omdb');

function get(term) {
  omdb.get(term, function (err, data) {
    console.log(err)
    console.log(data)
});
}
// 328 x 500
get({title: 'The Mission', year: '1986'})
