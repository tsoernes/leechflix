# leechflix
Popcorn-Time like movie streamer for torrentleech

**Usage**

1) [Download](/bin/leechflix-0.1.zip) and unzip

2) Enter your login credentials in /src/config.js

3) Run leechflix.bat


![alt text](http://s2.postimg.org/x94xwsn21/main.png "main")

![alt text](http://s2.postimg.org/6msh7tiux/details.png "det")


Build with NodeJS for Node-webkit; scraping with cheerio; OMDb API for movie info and images; webtorrent for torrent streaming.

@Todo

Bugfixing:

- spawn video player

Feautures:

-add support for tv shows

-add search

- retrieve all releases by search when viewing movie details

- return movies as promises for faster loading

- revamp gui

- add normal torrent download

- launch seeding in external client on finished download
