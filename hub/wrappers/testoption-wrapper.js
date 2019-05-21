/**
 * Wrapper for option models
 */


define(["./base-wrapper", "../main"], function(BaseWrapper, Hub){
    var Wrapper = BaseWrapper.extend({

        /**
         * Get the nodes linked to this option
         * @return {number[]}
         */
        nodes: function(){
            var thisModel = this;
            let testNodeIDs = Hub.get("optionnode").where({
                optionid: thisModel.id
            }).map(function(opnode){
                return opnode.get("testnodeid");
            });

            return testNodeIDs.map(function(id){
                return Hub.get("testnode").get(id);
            });
        },
        
        /**
         * Get the ids of nodes linked to this option
         * @return {number[]}
         */
        nodeIDs: function(){
            var thisModel = this;
            return thisModel.nodes().map(function(d){
                return d.get("id");
            });
        },
        
        
    });
    return function(toWrap){ return BaseWrapper.wrap(toWrap, Wrapper); };
});


