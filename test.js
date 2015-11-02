var fs = require('fs');
var omdb = require('omdb');
var show = { title: 'THE.MAN.FROM.U.N.C.L.E', year: "2015" };
omdb.get(show, false, function(err, movie) {
    if(err) {
        return console.error(err);
    }

    if(!movie) {
        return console.log('Movie not found!');
    }

    console.log(movie);
    var filename = "test2.jpg";
    var path = "./images/" + filename;
    omdb.poster(show)
        .pipe(fs.createWriteStream(path))
        .on('close', function() {})
});
