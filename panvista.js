Panvista = {};
Panvista.Domain = typeof(environmentBridge) == "object" ? environmentBridge.getSiteURL() : null;
Panvista.ApiVersion = '1.2';

Panvista.Sections = (function() {
    "use strict";

    return {
        /**
         * Get a list of sections.
         *
         * @param  function callback
         */
        list : function(callback) {
            PvRequest.load('/api/site/sections', function (xml) {
                if (xml == null || xml.getElementsByTagName("sections")[0] == undefined) {
                    callback({error: true}); //Return an empty object
                    return;
                }
                callback(Panvista.Sections._parseSectionData(xml.getElementsByTagName("sections")[0].childNodes));
            });
        },
        _parseSectionData : function(sectionList) {
            var sections = new Array();

            for (var i=0; i < sectionList.length; i++)
            {
                sections[i]          = {};
                sections[i].type     = sectionList[i].nodeName;
                sections[i].label    = sectionList[i].getAttribute("label");
                sections[i].id       = sectionList[i].getAttribute("id");
                sections[i].url      = sectionList[i].getAttribute("url");
                sections[i].children = new Array();

                if (sectionList[i].childNodes.length > 0) {
                    sections[i].children = Panvista.Sections._parseSectionData(sectionList[i].childNodes);
                }
            }

            return sections;
        }
    };
})();

Panvista.Articles = (function() {
    "use strict";

    return {
        /**
         * Get a list of sections.
         *
         * @param string     id       The id of the article list section
         * @param dictionary options
         * @param function   callback
         */
        list : function(id, options, callback) {
            var url = '/xml/mobile/list/categoryId/' + id + '?';

            if (!isNaN(parseInt(options.page))) {
                url += 'pageNumber=' + parseInt(options.page) + '&';
            }

            if (!isNaN(parseInt(options.limit))) {
                url += 'pageLimit=' + parseInt(options.limit) + '&';
            }

            PvRequest.load(url, function (xml) {
                if (xml == null || xml.getElementsByTagName("item").length < 0) {
                    callback({error: true}); //Return an empty object
                    return;
                }

                var articles         = {};
                articles.items       = Panvista.Articles._parseArticleData(xml.getElementsByTagName('item'));
                articles.total       = xml.getElementsByTagName('pagination')[0].getAttribute('totalItemCount');
                articles.currentPage = xml.getElementsByTagName('pagination')[0].getAttribute('pageNumber');
                articles.totalPages  = xml.getElementsByTagName('pagination')[0].getAttribute('pageCount');
                articles.limit       = xml.getElementsByTagName('pagination')[0].getAttribute('pageLimit');
                callback(articles);
            });
        },
        /**
         * Get the requested article
         *
         * @param  string   id       The id of the article
         * @param  function callback
         */
        get : function(id, callback) {
            PvRequest.load('/xml/mobile/article?id=' + id + '&format=xml', function (xml) {
                if (xml == null || xml.getElementsByTagName("webView").length < 0) {
                    callback({error: true}); //Return an empty object
                    return;
                }

                var article     = {};
                article.id      = id;
                article.section = {id: xml.getElementsByTagName('category')[0].getAttribute('id'),
                                   label: xml.getElementsByTagName('category')[0].getAttribute('label')};
                article.title   = xml.getElementsByTagName("rawView")[0].getAttribute('title');
                article.date    = xml.getElementsByTagName("rawView")[0].getAttribute('publishDate');
                article.content = xml.getElementsByTagName("rawView")[0].firstChild.data;
                callback(article);
            });
        },
        _parseArticleData : function(items) {
            var articles = new Array();

            for (var i=0; i < items.length; i++)
            {
                articles[i]             = {};
                articles[i].id          = items[i].getAttribute('id');
                articles[i].title       = items[i].getAttribute('title');
                articles[i].image       = items[i].getAttribute('imageUrl');
                articles[i].previewText = items[i].getElementsByTagName('p')[0].textContent;
                articles[i].images      = new Array();

                var imgNodes = items[i].getElementsByTagName('img');

                for (var x = 0; x < imgNodes.length; x++) {;
                    articles[i].images[x] = {'src'   : imgNodes[x].getAttribute('src'),
                                             'width' : imgNodes[x].getAttribute('width'),
                                             'height': imgNodes[x].getAttribute('height')};
                }
            }

            return articles;
        }
    };
})();

Panvista.Util = (function() {
    "use strict";

    return {
        device : null,
        paramKey : 'panvista-param-',
        params : new Object(),
        init : function() {
            for (var i = 0; i < localStorage.length; i++) {
                if (localStorage.key(i).substring(0, Panvista.Util.paramKey.length) == Panvista.Util.paramKey) {
                    Panvista.Util.params[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
                }
            }
            for (var key in Panvista.Util.params) {
                localStorage.removeItem(key);
            }
        },
        /**
         * Get a list of sections.
         *
         * @param  object    object
         * @param  function  callback
         */
        each : function(object, callback) {
            for (var key in object) {
                if (object.hasOwnProperty(key)) {
                    callback(object[key]);
                }
            }
        },
        /**
         * Get the current device
         *
         * @return string|null
         */
        getDevice : function() {
            if (Panvista.Util.device != null) {
                return Panvista.Util.device;
            }
            if(navigator.userAgent.match(/Android/i)) {
                return 'android';
            }
            if(navigator.userAgent.match(/iPad/i)) {
                return 'ipad';
            }
            if(navigator.userAgent.match(/iPhone|iPod/i)) {
                return 'iphone';
            }
            return null;
        },
        /**
         * Set the current device for the reqeust
         *
         * @param string
         */
        setDevice : function(device) {
            Panvista.Util.device = device;
        },
        /**
         * Set a parameter to be passed through to the next page
         *
         * @param string key
         * @param mixed  value
         */
        setParam : function(key, value) {
            localStorage.setItem(Panvista.Util.paramKey + key, value);
        },
        /**
         * Get a parameter that was passed through from the previous page
         *
         * @param  string key
         * @return mixed
         */
        getParam : function(key) {
            key = Panvista.Util.paramKey + key;
            if (key in Panvista.Util.params) {
                return Panvista.Util.params[key];
            }
            return null;
        }
    };
})();
Panvista.Util.init();

PvRequest = (function() {
    "use strict";

    return {
        load : function(endpoint, callback) {
            var xml = null;

            switch (endpoint) {
                case '/api/site/sections':
                    xml = typeof(sectionsBridge) == "object" ? (new window.DOMParser()).parseFromString(sectionsBridge.getSections(), "text/xml") : null;
                break;
            }

            if (xml) {
                callback(xml);
                return;
            }

            var request = new XMLHttpRequest();
            var url     = Panvista.Domain + endpoint + (endpoint.indexOf('?') == '-1' ? '?' : '&') + 'version=' + Panvista.ApiVersion + '&device=' + Panvista.Util.getDevice();

            function responseCallback() {
                if(request.readyState < 4) {
                    return;
                }

                if(request.status == 200 && request.readyState === 4) {
                    callback(request.responseXML ? request.responseXML : request.responseText);
                    return;
                }

                console.error("Unable to load %s", url);
                callback(null);
            }

            request.onreadystatechange = responseCallback;
            request.open('GET', url, true);
            request.setRequestHeader('X-JSMobileApp-Id', 'PVJSApi');
            request.setRequestHeader('X-JSMobileApp-Version', '0.7');

            if (endpoint.substring(0, 5) == '/xml/') {
                request.setRequestHeader('X-JSMobileApp-Api', '6');
            }

            request.send();
        }
    }
})();