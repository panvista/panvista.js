Panvista = {};
Panvista.Domain = typeof(environmentBridge) == "object" ? environmentBridge.getSiteURL() : null;
Panvista.ApiVersion = '1.2';

Panvista.Sections = (function() {
    "use strict";

    return {
        /**
         * Get a list of sections.
         *
         * @return array
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
         * @return array
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
                articles.items       = Panvista.Articles._parseArticleData(xml.getElementsByTagName('list')[0].children);
                articles.total       = xml.getElementsByTagName('pagination')[0].getAttribute('totalItemCount');
                articles.currentPage = xml.getElementsByTagName('pagination')[0].getAttribute('pageNumber');
                articles.totalPages  = xml.getElementsByTagName('pagination')[0].getAttribute('pageCount');
                articles.limit       = xml.getElementsByTagName('pagination')[0].getAttribute('pageLimit');
                callback(articles);
            });
        },
        get : function(id, callback) {
            PvRequest.load('/xml/mobile/article?id=' + id + '&format=xml', function (xml) {
                if (xml == null || xml.getElementsByTagName("webView").length < 0) {
                    callback({error: true}); //Return an empty object
                    return;
                }

                var article     = {};
                article.id      = id;
                article.section = { id: xml.getElementsByTagName('category')[0].getAttribute('id'),
                                    label: xml.getElementsByTagName('category')[0].getAttribute('label')}
                article.title   = xml.getElementsByTagName("rawView")[0].getAttribute('title');
                article.date    = xml.getElementsByTagName("rawView")[0].getAttribute('publishDate');
                article.content = xml.getElementsByTagName("rawView")[0].innerHTML.replace("<![CDATA[", "").replace("]]>", "");
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
                articles[i].previewText = items[i].firstChild.nextElementSibling.innerHTML;
            }

            return articles;
        }
    };
})();

Panvista.Util = (function() {
    "use strict";

    return {
        device : null,
        /**
         * Get a list of sections.
         *
         * @param object
         * @param callback
         * @return array
         */
        each : function(object, callback) {
            for (var key in object) {
                if (object.hasOwnProperty(key)) {
                    callback(object[key]);
                }
            }
        },
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
        setDevice : function(device) {
            Panvista.Util.device = device;
        }
    };
})();

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
