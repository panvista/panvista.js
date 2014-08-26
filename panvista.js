Panvista = {};
Panvista.Domain = typeof(environmentBridge) == "object" ? environmentBridge.getSiteURL() : null;
Panvista.ApiVersion = '1.3';

Panvista.Sections = (function() {
    "use strict";

    return {
        /**
         * Get a list of sections.
         *
         * @param  function callback
         */
        list : function(callback) {
            PvRequest.load({'endpoint': '/api/site/sections'}, function (xml) {
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
            var url = '/xml/mobile/list/categoryId/' + id;

            if (Object.keys(options).length > 0) {
                url += '?';
            }

            if (!isNaN(parseInt(options.page))) {
                url += 'pageNumber=' + parseInt(options.page) + '&';
            }

            if (!isNaN(parseInt(options.limit))) {
                url += 'pageLimit=' + parseInt(options.limit) + '&';
            }

            PvRequest.load({'endpoint': url}, function (xml) {
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
                Panvista.Analytics.add('viewCategory', {id: id});
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
            PvRequest.load({'endpoint': '/xml/mobile/article?id=' + id + '&format=xml'}, function (xml) {
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
                Panvista.Analytics.add('viewItem', {id: id, data : {type : "article"}});
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

Panvista.Content = (function() {
    "use strict";

    return {
        list : function(id, options, callback) {
            var url = '/api/content/list?id=' + id;

            if (!isNaN(parseInt(options.page))) {
                url += '&page=' + parseInt(options.page);
            }

            if (!isNaN(parseInt(options.limit))) {
                url += '&limit=' + parseInt(options.limit);
            }

            if (typeof(options.filter) == "object") {
                url += '&filter=' + encodeURIComponent(JSON.stringify(options.filter));
            }

            if (typeof(options.query) == "string") {
                url += '&query=' + encodeURIComponent(options.query);
            }

            PvRequest.load({'endpoint': url}, function (xml) {
                if (xml == null || xml.getElementsByTagName("documents")[0] == undefined) {
                    callback({error: true}); //Return an empty object
                    return;
                }
                Panvista.Analytics.add('viewCategory', {id: id});
                callback(xml.getElementsByTagName("documents")[0]);
            });
        },
        get : function(section_id, id, callback) {
            var url = '/api/content/document?section_id=' + section_id + '&id=' + id;

            PvRequest.load({'endpoint': url}, function (xml) {
                if (xml == null || xml.getElementsByTagName("document")[0] == undefined) {
                    callback({error: true}); //Return an empty object
                    return;
                }
                Panvista.Analytics.add('viewItem', {id: id, data : {type : "content"}});
                callback(xml.getElementsByTagName("document")[0]);
            });
        },
        filters : function(id, callback) {
            var url = '/api/content/filters?id=' + id;

            PvRequest.load(url, function (xml) {
                if (xml == null || xml.getElementsByTagName("filters")[0] == undefined) {
                    callback({error: true}); //Return an empty object
                    return;
                }
                callback(xml.getElementsByTagName("filters")[0]);
            });
        }
    }
})();

Panvista.Search = (function() {
    "use strict";

    return {
        site : function(query, options, callback) {
            var url = '/api/search/site?query=' + encodeURIComponent(query);

            if (!isNaN(parseInt(options.page))) {
                url += '&page=' + parseInt(options.page);
            }

            PvRequest.load({'endpoint': url}, function (xml) {
                if (xml == null || xml.getElementsByTagName("results")[0] == undefined) {
                    callback({error: true}); //Return an empty object
                    return;
                }
                callback(xml.getElementsByTagName("results")[0]);
            });
        }
    }
})();

Panvista.Analytics = (function() {
    "use strict";

    return {
        add : function(type, action) {
            var payload = {};
            payload.appId = typeof(userBridge) == "object" ? userBridge.getAppId() : null;

            if (!payload.appId) {
                return;
            }

            var accessToken = typeof(userBridge) == "object" ? userBridge.getTokenSecret() : undefined;

            if (typeof(accessToken) == 'string') {
                payload.accessToken = accessToken;
            }

            action.timestamp = new Date().getTime();
            action.device = Panvista.Util.getDevice();
            payload.payload = {};
            payload.payload[type] = [action];
            PvRequest.load({'endpoint' : '/api/analytics/data?s=' + encodeURIComponent(JSON.stringify(payload)),
                            'method' : 'POST'},
                           function(xml) {});
        }
    }
})();

Panvista.Profile = (function() {
    "use strict";

    return {
        fields : function(callback) {
            PvRequest.load({'endpoint': '/api/profile/fields'}, function(xml) {
                if (xml == null || xml.getElementsByTagName("fields")[0] == undefined) {
                    callback({error: true}); //Return an empty object
                    return;
                }

                callback(xml.getElementsByTagName("fields")[0]);
            });
        },
        info : function(callback) {
            PvRequest.load({'endpoint': '/api/profile/info'}, function(xml) {
                if (xml == null || xml.getElementsByTagName("user")[0] == undefined) {
                    callback({error: true}); //Return an empty object
                    return;
                }

                callback(xml.getElementsByTagName("user")[0]);
            });
        },
        update : function(params, callback) {
            PvRequest.load({'endpoint' : '/api/profile/update',
                            'params' : params,
                            'method' : 'POST'},
                           function(xml) {
                               var result = [];
                               for (var i = 0; i < xml.getElementsByTagName("message").length; i++) {
                                   result[i] = {result: xml.getElementsByTagName("message")[i].getAttribute("type"), message: xml.getElementsByTagName("message")[i].textContent}
                               }
                               callback(result);
                           });
        }
    }
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
            if (typeof(environmentBridge) == "object") {
                var parseQueryString = function(queryString) {
                    var params = {}, queries, temp, i, l;

                    queries = queryString.split("&");

                    for ( i = 0, l = queries.length; i < l; i++ ) {
                        temp = queries[i].split('=');
                        params[temp[0]] = temp[1];
                    }

                    return params;
                };
                var url = environmentBridge.getContentURL();
                var params = parseQueryString(url.substring(url.indexOf('?') + 1));
                for (var key in params) {
                    if (params.hasOwnProperty(key)) {
                        Panvista.Util.params[Panvista.Util.paramKey + key] = params[key];
                    }
                }
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
        },
        parseXml : function(xml) {
            return (new window.DOMParser()).parseFromString(xml, "text/xml");
        }
    };
})();
Panvista.Util.init();

PvRequest = (function() {
    "use strict";

    return {
        pendingRequest : null,
        load : function(options, callback) {
            var xml    = null,
                result = null;

            switch (options.endpoint) {
                case '/api/site/sections':
                    result = typeof(sectionsBridge) == "object" ? sectionsBridge.getSections() : undefined;
                    xml    = typeof(result) != "undefined" ? Panvista.Util.parseXml(result) : null;
                break;
                default:
                    result = typeof(sectionsBridge) == "object" ? sectionsBridge.getXmlData(options.endpoint) : undefined;
                    xml    = typeof(result) != "undefined" ? Panvista.Util.parseXml(result) : null;
                break;
            };

            if (xml && result.length != 0) {
                callback(xml);
                return;
            }

            var url         = Panvista.Domain + options.endpoint + (options.endpoint.indexOf('?') == '-1' ? '?' : '&') + 'version=' + Panvista.ApiVersion + '&device=' + Panvista.Util.getDevice();
            var accessToken = typeof(userBridge) == "object" ? userBridge.getAccessToken() : undefined;
            var tokenSecret = typeof(userBridge) == "object" ? userBridge.getTokenSecret() : undefined;
            var params      = typeof(options.params) == "object" ? PvRequest.serialize(options.params) : "";

            if (typeof(accessToken) == 'string' && typeof(tokenSecret) == 'string') {
                var request = function() {
                    var nonce = Math.floor(Math.random() * 999999);
                    var signature = CryptoJS.HmacSHA1(accessToken + "&" + nonce, tokenSecret);
                    params += "&nonce=" + nonce + "&access_token=" + accessToken + "&signature_method=HMAC-SHA1&version=1.0&signature=" + signature;
                    var request = new XMLHttpRequest();
                    request.open('POST', url, true);
                    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                    return request;
                }();
            } else {
                var request = function() {
                    var request = new XMLHttpRequest();
                    var method = typeof(options.method) == 'string' ? options.method : 'GET';
                    request.open(method, url, true);

                    if (method == 'POST') {
                        request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                    }

                    return request;
                }();
            }

            function responseCallback() {
                if(request.readyState < 4) {
                    return;
                }

                if(request.status == 200 && request.readyState === 4) {
                    callback(request.responseXML ? request.responseXML : null);
                    return;
                }

                console.error("Unable to load %s", url);
                callback(null);
            }

            request.onreadystatechange = responseCallback;
            request.setRequestHeader('X-JSMobileApp-Id', 'PVJSApi');
            request.setRequestHeader('X-JSMobileApp-Version', '0.7');
            request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

            if (options.endpoint.substring(0, 5) == '/xml/') {
                request.setRequestHeader('X-JSMobileApp-Api', '6');
            }

            request.send(params);
            this.pendingRequest = request;
        },
        serialize : function(obj, prefix) {
            var str = [];

            for(var p in obj) {
                var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
                str.push(typeof v == "object" ? PvRequest.serialize(v, k) : encodeURIComponent(k) + "=" + encodeURIComponent(v));
            }

            return str.join("&");
        }
    }
})();

/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS=CryptoJS||function(g,l){var e={},d=e.lib={},m=function(){},k=d.Base={extend:function(a){m.prototype=this;var c=new m;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
p=d.WordArray=k.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=l?c:4*a.length},toString:function(a){return(a||n).stringify(this)},concat:function(a){var c=this.words,q=a.words,f=this.sigBytes;a=a.sigBytes;this.clamp();if(f%4)for(var b=0;b<a;b++)c[f+b>>>2]|=(q[b>>>2]>>>24-8*(b%4)&255)<<24-8*((f+b)%4);else if(65535<q.length)for(b=0;b<a;b+=4)c[f+b>>>2]=q[b>>>2];else c.push.apply(c,q);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
32-8*(c%4);a.length=g.ceil(c/4)},clone:function(){var a=k.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],b=0;b<a;b+=4)c.push(4294967296*g.random()|0);return new p.init(c,a)}}),b=e.enc={},n=b.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],f=0;f<a;f++){var d=c[f>>>2]>>>24-8*(f%4)&255;b.push((d>>>4).toString(16));b.push((d&15).toString(16))}return b.join("")},parse:function(a){for(var c=a.length,b=[],f=0;f<c;f+=2)b[f>>>3]|=parseInt(a.substr(f,
2),16)<<24-4*(f%8);return new p.init(b,c/2)}},j=b.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],f=0;f<a;f++)b.push(String.fromCharCode(c[f>>>2]>>>24-8*(f%4)&255));return b.join("")},parse:function(a){for(var c=a.length,b=[],f=0;f<c;f++)b[f>>>2]|=(a.charCodeAt(f)&255)<<24-8*(f%4);return new p.init(b,c)}},h=b.Utf8={stringify:function(a){try{return decodeURIComponent(escape(j.stringify(a)))}catch(c){throw Error("Malformed UTF-8 data");}},parse:function(a){return j.parse(unescape(encodeURIComponent(a)))}},
r=d.BufferedBlockAlgorithm=k.extend({reset:function(){this._data=new p.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=h.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,b=c.words,f=c.sigBytes,d=this.blockSize,e=f/(4*d),e=a?g.ceil(e):g.max((e|0)-this._minBufferSize,0);a=e*d;f=g.min(4*a,f);if(a){for(var k=0;k<a;k+=d)this._doProcessBlock(b,k);k=b.splice(0,a);c.sigBytes-=f}return new p.init(k,f)},clone:function(){var a=k.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});d.Hasher=r.extend({cfg:k.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){r.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(b,d){return(new a.init(d)).finalize(b)}},_createHmacHelper:function(a){return function(b,d){return(new s.HMAC.init(a,
d)).finalize(b)}}});var s=e.algo={};return e}(Math);
(function(){var g=CryptoJS,l=g.lib,e=l.WordArray,d=l.Hasher,m=[],l=g.algo.SHA1=d.extend({_doReset:function(){this._hash=new e.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(d,e){for(var b=this._hash.words,n=b[0],j=b[1],h=b[2],g=b[3],l=b[4],a=0;80>a;a++){if(16>a)m[a]=d[e+a]|0;else{var c=m[a-3]^m[a-8]^m[a-14]^m[a-16];m[a]=c<<1|c>>>31}c=(n<<5|n>>>27)+l+m[a];c=20>a?c+((j&h|~j&g)+1518500249):40>a?c+((j^h^g)+1859775393):60>a?c+((j&h|j&g|h&g)-1894007588):c+((j^h^
g)-899497514);l=g;g=h;h=j<<30|j>>>2;j=n;n=c}b[0]=b[0]+n|0;b[1]=b[1]+j|0;b[2]=b[2]+h|0;b[3]=b[3]+g|0;b[4]=b[4]+l|0},_doFinalize:function(){var d=this._data,e=d.words,b=8*this._nDataBytes,g=8*d.sigBytes;e[g>>>5]|=128<<24-g%32;e[(g+64>>>9<<4)+14]=Math.floor(b/4294967296);e[(g+64>>>9<<4)+15]=b;d.sigBytes=4*e.length;this._process();return this._hash},clone:function(){var e=d.clone.call(this);e._hash=this._hash.clone();return e}});g.SHA1=d._createHelper(l);g.HmacSHA1=d._createHmacHelper(l)})();
(function(){var g=CryptoJS,l=g.enc.Utf8;g.algo.HMAC=g.lib.Base.extend({init:function(e,d){e=this._hasher=new e.init;"string"==typeof d&&(d=l.parse(d));var g=e.blockSize,k=4*g;d.sigBytes>k&&(d=e.finalize(d));d.clamp();for(var p=this._oKey=d.clone(),b=this._iKey=d.clone(),n=p.words,j=b.words,h=0;h<g;h++)n[h]^=1549556828,j[h]^=909522486;p.sigBytes=b.sigBytes=k;this.reset()},reset:function(){var e=this._hasher;e.reset();e.update(this._iKey)},update:function(e){this._hasher.update(e);return this},finalize:function(e){var d=
this._hasher;e=d.finalize(e);d.reset();return d.finalize(this._oKey.clone().concat(e))}})})();
