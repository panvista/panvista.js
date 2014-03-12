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
                sections[i] = {};
                sections[i].type = sectionList[i].nodeName;
                sections[i].label = sectionList[i].getAttribute("label");
                sections[i].id = sectionList[i].getAttribute("id");
                sections[i].url = sectionList[i].getAttribute("url");
                sections[i].children = new Array();

                if (sectionList[i].childNodes.length > 0) {
                    sections[i].children = Panvista.Sections._parseSectionData(sectionList[i].childNodes);
                }
            }

            return sections;
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
            var url     = Panvista.Domain + endpoint + '?version=' + Panvista.ApiVersion + '&device=' + Panvista.Util.getDevice();

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

            if (endpoint.substring(0, 5) == '/xml/') {
                request.setRequestHeader('X-JSMobileApp-Id', 'PVJSApi');
                request.setRequestHeader('X-JSMobileApp-Version', '1.0');
                request.setRequestHeader('X-JSMobileApp-Api', '6');
            }
            request.send();
        }
    }
})();