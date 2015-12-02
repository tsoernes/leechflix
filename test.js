var kat = require("kat-api-json");
kat.mostPopular({
  category: "tv",
  page: 1
},function(err,data){
  if ( err ) {
    throw err;
  }

  console.log(data);

});
