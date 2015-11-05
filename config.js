var config = {};

config.credentials = {
	username: "enter username here",
	password: "enter password here",
	remember_me: "on"
};

config.urls = {
	login: "https://torrentleech.org/user/account/login/",
	searchBeg: "https://torrentleech.org/torrents/browse/index/query/",
	searchEnd: "/categories/13%2C14/facets/tags%253Anonscene",
	moviesNew: "https://torrentleech.org/torrents/browse/index/categories/13%2C14/facets/tags%253Anonscene/page/1",
	moviesPopBeg: "https://www.torrentleech.org/torrents/browse/index/categories/13%2C14/facets/tags%253Anonscene_added%253A%255BNOW%252FMINUTE-",
	moviesPopEnd: "%2BTO%2BNOW%252FMINUTE%252B1MINUTE%255D/orderby/completed/order/desc/page/1"
}
// /page/1, /page/2 etc

config.torrentDir = "./torrents/";
config.cookiePath = "cookies.json";

module.exports = config;
