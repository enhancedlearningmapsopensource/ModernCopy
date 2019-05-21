/**
 * Wrapper for test models
 */


define(["./base-wrapper", "../main"], function(BaseWrapper, Hub){
    var Wrapper = BaseWrapper.extend({
        
        /**
         * Get the ids of instances of this test
         * @return {number[]}
         */
        instanceIDs: function(){
            var thisModel = this;
            return Hub.get("testinstance").where({testid: thisModel.id}).map(function(d){
                return d.get("id");
            });
        },

        /**
         * Get the questions in this test
         * @return {number[]}
         */
        questions: function(){
            const thisModel = this;
            return Hub.get("testquestion").where({testid: thisModel.id});
        },

        /**
         * Get the ids of questions in this test
         * @return {number[]}
         */
        questionIDs: function(){
            const thisModel = this;
            return thisModel.questions().map(function(d){
                return d.get("id");
            });
        }
        
        
    });
    return function(toWrap){ return BaseWrapper.wrap(toWrap, Wrapper); }
});


