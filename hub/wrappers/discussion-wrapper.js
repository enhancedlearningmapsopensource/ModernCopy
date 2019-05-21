/**
 * Wrapper for map models
 */


define(["./base-wrapper", "../main"], function(BaseWrapper, Hub){
    var Wrapper = BaseWrapper.extend({
        /**
         * Add a post to the discussion
         * @param {string} msg - the message to post
         * @param {Object} options - the options
         * @param {number=-1} options.originalID - if replying to an existing post then include the post's id
         * @param {DataInterfacer=null} options.dataInterface - will use application's if avaliable
         * @return {Promise}
         */
        addPost(msg, options){
            var thisModel = this;
            
            options = (!options) ? {} : options;
            options.originalID = (!options.hasOwnProperty("originalID")) ? -1 : options.originalID;
            assertType(options.originalID, 'number');
            
            if(!options.hasOwnProperty("dataInterface")){
                if(typeof application === 'undefined'){
                    throw Error("Cannot addPost. No data interface provided and application does not exist");
                }else{
                    options.dataInterface = application.datainterface;
                }
            }
            
            var postID = null;
            var msgID = null;
            
            // Create the post
            return options.dataInterface.get("post").create({
                did: thisModel.id
            }).then(function(n){
                                
                // Save id
                postID = n.id;
                
                var post = Hub.get("post").get(postID);
                
                return Hub.wrap(post).edit(msg);
                
                // Set the message
                /*return options.dataInterface.get("post").get(postID).edit(msg, {
                    dataInterface: options.dataInterface
                });*/
            });            
        },
        
        /**
         * Delete the post with the given id
         * @param {Object} options - the options
         * @param {DataInterfacer=null} options.dataInterface - will use application's if avaliable
         * @returns {unresolved}
         */
        deletePost: function(postid, options){
            var thisModel = this;
            
            options = (!options) ? {} : options;
            options.originalID = (!options.hasOwnProperty("originalID")) ? -1 : options.originalID;
            assertType(options.originalID, 'number');
            
            if(!options.hasOwnProperty("dataInterface")){
                if(typeof application === 'undefined'){
                    throw Error("Cannot addPost. No data interface provided and application does not exist");
                }else{
                    options.dataInterface = application.datainterface;
                }
            }
            
            // Verify that the post belongs to the discussion
            var postVerify = thisModel.getPostIDs().find(function(d){
                return (d == postid);
            });
            if(!postVerify){
                throw Error("Error. Post with id=" + postid + ", is not associated with discussion id=" + thisModel.id);
            }
            return Hub.get("post").get(postid).destroy();
        },
        
        
        /**
         * Get the ids of the posts for this discussion
         * @return {number[]}
         */
        getPostIDs: function(){
            var thisModel = this;
            return thisModel.getPosts().map(function(d){
                return d.get("postid");
            });
        },
        
        /**
         * Get the ids of the standards tagged with the domain
         * @return {number[]}
         */
        getPosts: function(){
            var thisModel = this;
            return Hub.get("post").where({
                did: thisModel.id
            }).filter(function(post){
                return (post.get("datedeleted") === null || post.get("datedeleted") === TIME_ZERO || post.get("datedeleted") === "0000-00-00 00:00:00");
            });
        }
        
        
        
    });
    return function(toWrap){ return BaseWrapper.wrap(toWrap, Wrapper); }
});


