var gui = require('nw.gui');
var scraper = require('../scraper.js');
var config = require('../config.js');

var swig = 					require('swig');
var appTemplate = 			swig.compileFile('templates/app.html');
var movieLibraryTemplate =   swig.compileFile('templates/app_movieLibrary.html');
var mOverlayTemplate = 		swig.compileFile('templates/movieOverlay.html');
//var movieDetailsTemplate = 	swig.compileFile('templates/movieDetails.html');

var results;

function start() {
	appStatus="showMain";
    fetch(config.browseMoviesUrl);
}

function fetch(url) {
    scraper.fetch(url, function(err, res) {
        if (err) {
            console.log("err" + err);
        } else {
            console.log(res);
            results = res;
            sendItemsToView(res);
        }
    });
}

function play(url) {
    console.log("play");
}

function sendItemsToView(movies) {
    document.body.innerHTML = (appTemplate());
	if(movies !== null){
		document.getElementById('movieLibrary_content').innerHTML = (movieLibraryTemplate({items:movies}));
	}
	else  document.getElementById('movieLibrary_content').innerHTML = "";
    initUI();
}

function initUI() {
	$("#overlayMovie").easyModal({ onClose: function(myModal){overlayType="no";}});
}

function showMovieOverlay(position) {
	overlayNumber=parseInt(position);
	if(results[overlayNumber]==undefined) {
		overlayType="no"
	}
	else {
        // @TODO
		overlayType="movie";
		var movie = results[position];
		document.getElementById("overlayMovie").innerHTML = (mOverlayTemplate({movie:movie,path:path,position:position}));
		$('#overlayMovie').trigger('openModal');
	}
}
