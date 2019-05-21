/**
 * Wrapper for map models
 */


define(["./base-wrapper", "../main"], function(BaseWrapper, Hub){
    var Wrapper = BaseWrapper.extend({
        
        /**
         * Get the ids of the standards tagged with the domain
         * @return {number[]}
         */
        standardIDs: function(){
            var thisModel = this;
            var standards = Hub.get("standard").where({domainid: thisModel.id}).map(function(d){
                return Number(d.get("sid"));
            });
            return standards;
        },
    });
    return function(toWrap){ return BaseWrapper.wrap(toWrap, Wrapper); }
});


