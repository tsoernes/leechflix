var info = scraperhelper.extractInfoFromName(name);

      // @TODO add files to a different view if they do not have info or image
      var searchTerm = {terms: info.title, year: info.year, specialChars: true};
      asyncTasks.push(function(callback){
        getOmdbInfo(searchTerm, function (err, res) {
          if (err) {
            var isCollection = true;
            info.rlsDetails = name;
            omdbInfo = {title: "Not found in IMDb", year: "", runtime: "", actors: "", plot: "", imdb: {id: "", rating: 10, votes: 0}, poster: "../static/folder2.jpg"};
          } else {
            omdbInfo = res;
            var isCollection = false;
            omdbInfo.genres = omdbInfo.genres.map(function(s) {return ' '+s;});
            omdbInfo.genres[0] = omdbInfo.genres[0].substring(1);
          }

          var movieInfo = {
            isCollection: isCollection,
            title: omdbInfo.title,
            year: omdbInfo.year,
            release: [{
              rlsDetails: info.rlsDetails,
              detailsUrl: detailsUrl,
              torrentUrl: torrentUrl,
              size: size,
              seeders: seeders,
              leechers: leechers
            }],
            runtime: omdbInfo.runtime,
            genres: omdbInfo.genres,
            actors: omdbInfo.actors,
            plot: omdbInfo.plot,
            imdbId: omdbInfo.imdb.id,
            imdbRating: omdbInfo.imdb.rating,
            imdbVotes: omdbInfo.imdb.votes,
            imgUrl: omdbInfo.poster
          }

          var added = false;
          for (var j=0; j<results.length; j++) {
            if (results[j].imdbId == movieInfo.imdbId) {
              results[j].release.push(movieInfo.release[0]);
              added = true;
              break;
            }
          }
          if (!added) {
            results.push(movieInfo);
          }

          callback();
        });
        });
