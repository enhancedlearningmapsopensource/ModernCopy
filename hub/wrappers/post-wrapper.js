/**
 * Wrapper for map models
 */


define(["./base-wrapper", "../main"], function(BaseWrapper, Hub){
    var Wrapper = BaseWrapper.extend({
        
        /**
         * Edit the posted message
         * @param {string} msg - the message to post
         * @param {Object} options
         * @param {DataInterfacer=null} options.dataInterface - will use application's if avaliable
         * @returns {Promise}
         */
        edit: function(msg){
            var thisModel = this;
            
            // Create the new msg
            return Hub.get("msg").create({
                postid: thisModel.id,
                msg: msg
            }, {wait:true});
        },
        
        /**
         * Get the message ids for this post
         * @return {number[]}
         */
        getMIDs: function(){
            var thisModel = this;
            return thisModel.getMsgs().map(function(d){
                return d.get("mid");
            });
        },
        
        /**
         * Get the messages for this post
         * @return {number[]}
         */
        getMsgs: function(){
            var thisModel = this;
            return Hub.get("msg").where({postid: thisModel.id});
        },
        
        /**
         * Reply to the post
         * 
         * @param {string} msg - the reply message
         * @param {Object} options
         * @param {DataInterfacer=null} options.dataInterface - will use application's if avaliable
         * @returns {Promise}
         */
        reply: function(msg){
            var thisModel = this;
            
            // Create the new reply post
            return Hub.get("post").create({
                did: thisModel.get("did"),
                originalid: thisModel.id
            }, {wait:true}).then(function(replyPost){
                // Set the message of the reply post
                return Hub.wrap(replyPost).edit(msg);
            });
        }
    });
    return function(toWrap){ return BaseWrapper.wrap(toWrap, Wrapper); }
});


