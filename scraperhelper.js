/*
Extract title, year and the details of the release from a string.
Example: "The Man From U.N.C.L.E 2015 1080p BDRip-Haxx0r" -->
{Title: "The Man From U.N.C.L.E", Year: "2015", rlsDetails: "1080p BDRip-Haxx0r" }
*/
exports.extractInfoFromName = function(name) {
	function isDigit(c) {
		return ((c >= '0') && (c <= '9'));
	}
	var title = '';
	var year = 0;
	var rlsDetails = '';
	for (var i=0; i<name.length-4; i++) {
		if (isDigit(name[i]) && isDigit(name[i+1]) && isDigit(name[i+2]) && isDigit(name[i+3])) {
			if (name.substring(i,i+3) != '1080') {
				title = name.substring(0, i-1);
				year = name.substring(i,i+4);
				rlsDetails = name.substring(i+5);
				break;
			}
		}
	}
	if (title == '' || year == 0 || year == '') {
		console.log("Could not extract info from " + name);
	}
	return ({
		title: title,
		year: year,
		rlsDetails: rlsDetails
	});
}


/*
Sort the releases of each movie by the number of seeders in descending
order.
*/
exports.sortReleasesBySeeders = function(movies) {
    for (var i=0; i<movies.length; i++) {
        movies[i].release = movies[i].release.sort(function(b, a) {
            return parseFloat(a.seeders) - parseFloat(b.seeders);
        });
    }
    return movies;
}

/*
Sort the movies the IMDb rating in descending
order.
*/
exports.sortMoviesByImdbRating = function(movies) {
    return movies.sort(function(b, a) {
        return parseFloat(a.imdbRating) - parseFloat(b.imdbRating);
    });
}
