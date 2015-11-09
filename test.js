var movie = require('node-movie');

function get(term) {
  movie(term, function (err, data) {
    console.log(err)
    console.log(data)
});
}

get('furious 7')
