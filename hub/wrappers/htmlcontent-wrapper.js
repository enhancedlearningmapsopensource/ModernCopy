define(["./base-wrapper", "../main"], function(BaseWrapper, Hub){
    var Wrapper = BaseWrapper.extend({
        
        /**
         * Get the ids of the standards tagged with the grade
         * @return {number[]}
         */
        toString: function(){
            var thisModel = this;
            var content = thisModel.get("content");
            return Hub.stripHtml(content);
        },
        
        //(MATCHES ? MSCOREAVE : 0)
    });
    return function(toWrap){ return BaseWrapper.wrap(toWrap, Wrapper); }
});

