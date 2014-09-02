PvDev = {};

userBridge = (function() {
    "use strict";

    return {
        accessToken : undefined,
        tokenSecret : undefined,
        appId       : "DEV-PVAPI",
        getAppId : function() {
            return userBridge.appId;
        },
        getAccessToken : function() {
            return userBridge.accessToken;
        },
        getTokenSecret : function() {
            return userBridge.tokenSecret;
        }
    }
})();

PvDev.Settings = (function() {
    "use strict";

    return {
        setDomain : function(domain) {
            Panvista.Domain = 'https://' + domain + '/';
        },
        setDevice : function(device) {
            Panvista.Util.setDevice(device);
        },
        setUserTokens : function(accessToken, tokenSecret) {
            userBridge.accessToken = accessToken;
            userBridge.tokenSecret = tokenSecret;
        },
        setAppId : function(appId) {
            userBridge.appId = appId;
        }
    };
})();
