define(["./base-wrapper", "../main"], function(BaseWrapper, Hub){
    var Wrapper = BaseWrapper.extend({
        /**
         * Get the ids of the nodes tagged with the standard
         * @return {number[]}
         */
        nodeIDs: function(){
            var thisModel = this;
            return Hub.get("nodetostandard").where({sid: thisModel.id}).map(function(r){
                return Number(r.get("nodeid"));
            });
        },
        
        /**
         * Get the standard textid. Used by old standard to derive textid.
         * @return {string} - standard textid.
         */
        textID: function(){
            var thisModel = this;
            return thisModel.get("textid");
        }
    });
    
    return function(toWrap){ return BaseWrapper.wrap(toWrap, Wrapper); }
});
