var fs = require('fs');
var omdb = require('omdb');

function getShow() {
    var show = { terms: "limitless", type: 'series' };
    omdb.search(show, function(err, movie) {
        if(err) {
            return console.error(err);
        }

        if(!movie) {
            return console.log('Movie not found!');
        }

        console.log(movie);
        omdb.get(movie[0].imdb, function(err, res) {
            console.log(res);
        })
        var filename = "test2.jpg";
        var path = filename;
        omdb.poster(movie[0].imdb)
            .pipe(fs.createWriteStream(path))
            .on('close', function() {})
    });
}

function getMovie() {
    var show = { title: "Maze Runner Scorch Trials", year: '2015' };
    omdb.get(show, true, function(err, movie) {
        if(err) {
            return console.error(err);
        }

        if(!movie) {
            return console.log('Movie not found!');
        }

        console.log(movie);
        var filename = "./images/" + movie.title + ".jpg";
        var path = filename;
        omdb.poster(movie.imdb)
            .pipe(fs.createWriteStream(path))
            .on('close', function() {})
    });
}
 getMovie();
