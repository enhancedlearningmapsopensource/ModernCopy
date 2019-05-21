/**
 * Wrapper for question models
 */


define(["./base-wrapper", "../main"], function(BaseWrapper, Hub){
    var Wrapper = BaseWrapper.extend({

        /**
         * Get the options in this question
         * @return {number[]}
         */
        options: function(){
            var thisModel = this;
            return Hub.get("testoption").where({questionid: thisModel.id});
        },
        
        /**
         * Get the ids of options in this question
         * @return {number[]}
         */
        optionIDs: function(){
            var thisModel = this;
            return thisModel.options().map(function(d){
                return d.get("id");
            });
        },
        
        
    });
    return function(toWrap){ return BaseWrapper.wrap(toWrap, Wrapper); };
});


