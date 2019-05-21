/* global gRoot, userSite */

/**
 * Wrapper for resource models
 */
define(["./base-wrapper", "../main"], function(BaseWrapper, Hub){
    var pvt = {
        consts: {
            BASH_BASE: "https://elmap.us/admincopy/lessons/archive/TIMESTAMP/URL?RANDOM#pagemode=bookmarks"
        }
    };
    
    var Wrapper = BaseWrapper.extend({
        
        /**
         * Get a link that is viewable
         * @return {String} - the url for the resource so that it can be viewed
         */
        link: function(){
            var thisModel = this;
            var resource = thisModel;
            if(resource.get("islink") === 0){
                // Get the bash timestamp for the current model
                var bashtimestamp = resource.get("bashtimestamp");
                if(bashtimestamp === null){
                    bashtimestamp = "";
                }
                bashtimestamp = bashtimestamp.trim();

                if(bashtimestamp.length > 0 && bashtimestamp !== "n/a"){
                    return pvt.consts.BASH_BASE
                            .replace("URL",resource.get("url"))
                            .replace("TIMESTAMP", resource.get("bashtimestamp").trim());
                }
                
                if(resource.get("url") !== null && resource.get("url").trim().length > 0){
                    
                    var url = resource.get("url");
                    if($.isNumeric(url)){
                        var file = Hub.get("file").get(resource.get("url"));
                        url = file.get("url");
                    }
                    
                    return url;
                }
            }else{
                if(resource.get("url") !== null && resource.get("url").trim().length > 0){
                    return resource.get("url");
                }
            }
            return "";
        },
        
        /**
         * Get maps that are visible to the user and associated with the resource by the user.
         */
        userMaps: function(){
            var thisModel = this;
            var maps = Hub.get("mapresource").where({resourceid: thisModel.id, editorid: userID}, false, Hub);
            return maps.map(function(d){
                return d.get("mapid");
            });
        },
        
        /**
         * Get the ids of maps that are visible to the user and associated with the resource by the user.
         */
        userMapIDs: function(){
            var thisModel = this;
            var maps = Hub.get("mapresource").where({resourceid: thisModel.id, editorid: userID}, false, Hub);
            return maps.map(function(d){
                return d.get("mapid");
            });
        }
    });
    return function(toWrap){ return BaseWrapper.wrap(toWrap, Wrapper); }
});

