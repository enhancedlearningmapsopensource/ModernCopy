/**
 * Test discussion manager without removing/changing existing discussions.
 */
define(["corestate/templates/site/windows/graph/side-panel/panels/map-discussion/discussion-manager/discussion-manager", 
        // "jsclass!3rdParty/jsclass/",
        //"corestate/js/managers/manager-controller-factory"
        "data-interfacer"
], 
function(DiscussionManager, 
        //JsClass, 
        DataInterface){
    var pvt = {
        consts: {
        }
    };
    
    var lock = false;  
    var controller = [];
    
    QUnit.module("test-discussion-manager", {
        before: function(){
            
        },
        beforeEach: function(){
            var dataInterface = new DataInterface();
            this.manager = new DiscussionManager(dataInterface);
            return dataInterface.load(userID, 1);
        }
    });
    
    QUnit.test("test start new map topic", function( assert ) {
        var thisTest = this;
        var state = thisTest.manager.initialState();
        var randomMessage = pvt.generateRandomString(25);
        var nodes = [249,254,323,346,751,755,756,888,1372,1515,1516,1693,1695,1698];
        var graphID = 264;
        
        var mapTitle = "RL.3.2";
        pvt.runTest(assert, function(){
            return thisTest.manager.process(state, graphID, nodes, "ela").then(function(discussions){
                // Get map posts
                var mapPosts = discussions.sections.find(function(s){
                    return (s.typeuc == "Map");
                });
                
                // Check existing posts for message
                if(mapPosts.discussions.length > 0){
                    if(mapPosts.discussions.posts.length > 0){
                        assert.ok(typeof mapPosts.discussions.posts.find(function(post){
                            return (post.msg == randomMessage);
                        }) === 'undefined', "existing posts do not match");
                    }
                }
                return thisTest.manager.startNewTopic("map", graphID, randomMessage);
            }).then(function(){
                return thisTest.manager.process(state, graphID, nodes, "ela");
            }).then(function(discussions){
                // Get map posts
                var mapPosts = discussions.sections.find(function(s){
                    return (s.typeuc == "Map");
                });
                
                // Check existing posts for message
                assert.ok(mapPosts.discussions.posts.length > 0);
                assert.ok(typeof mapPosts.discussions.posts.find(function(post){
                    return (post.msg == randomMessage);
                }) !== 'undefined', "found new post");
            });
            return Promise.resolve();
        });
    });
    
    QUnit.test("delete map topic", function( assert ) {
        var thisTest = this;
        var state = thisTest.manager.initialState();
        var randomMessage = pvt.generateRandomString(25);
        var nodes = [249,254,323,346,751,755,756,888,1372,1515,1516,1693,1695,1698];
        var graphID = 264;
        var subject = "ela";
        
        var addOptions = {
            typeuc: "Map",
            graphID: graphID,
            msg: randomMessage,
            nodes: nodes,
            subject: subject,
            state: state
        };
        
        var mapTitle = "RL.3.2";
        pvt.runTest(assert, function(){
            return pvt.addPost.call(thisTest, addOptions, assert).then(function(postid){   
                return thisTest.manager.deletePost(postid, graphID, nodes, subject)
            }).then(function(){
                return thisTest.manager.process(state, graphID, nodes, subject);
            }).then(function(discussions){
                // Get map posts
                var mapPosts = discussions.sections.find(function(s){
                    return (s.typeuc == "Map");
                });
                
                // Check existing posts for message
                if(mapPosts.discussions.posts.length > 0){
                    assert.ok(typeof mapPosts.discussions.posts.find(function(post){
                        return (post.msg == randomMessage);
                    }) === 'undefined', "existing posts do not match");
                }
            });
            return Promise.resolve();
        });
    });
    
    QUnit.test("edit map topic", function( assert ) {
        var thisTest = this;
        var state = thisTest.manager.initialState();
        var randomMessage = pvt.generateRandomString(25);
        var editedMessage = pvt.generateRandomString(25);
        var nodes = [249,254,323,346,751,755,756,888,1372,1515,1516,1693,1695,1698];
        var graphID = 264;
        var subject = "ela";
        
        assert.notEqual(randomMessage, editedMessage, "messages are equal");
        
        var addOptions = {
            typeuc: "Map",
            graphID: graphID,
            msg: randomMessage,
            nodes: nodes,
            subject: subject,
            state: state
        };
        
        var mapTitle = "RL.3.2";
        // Add a new post
        return pvt.addPost.call(thisTest, addOptions, assert).then(function(postid){  
            // Edit the post
            return Promise.all([thisTest.manager.editPost(postid, graphID, nodes, subject, editedMessage), postid]);
        }).then(function(results){
            // Verify the edit
            return Promise.all([thisTest.manager.process(state, graphID, nodes, subject), results[1]]);
        }).then(function(results){
            var discussions = results[0];
            var postid = results[1];

            // Get map posts
            var mapPosts = discussions.sections.find(function(s){
                return (s.typeuc == addOptions.typeuc);
            });

            // Check existing posts for message
            assert.ok(mapPosts.discussions.posts.length > 0);

            var post = mapPosts.discussions.posts.find(function(post){
                return (post.id == postid);
            });
            assert.ok(typeof post !== 'undefined', "could not find post matching id");
            assert.equal(post.msg, editedMessage, "post message doesn't match");
            return Promise.resolve(postid);
        }).then(function(postid){    
            // Delete the post
            return pvt.deletePost.call(thisTest, postid, addOptions, assert);
        });
    });
    
    /**
     * Adds and then verfies the existance of a new post
     */
    pvt.addPost = function(options, assert){
        var thisTest = this;
        return thisTest.manager.process(options.state, options.graphID, options.nodes, options.subject).then(function(discussions){
            // Get map posts
            var mapPosts = discussions.sections.find(function(s){
                return (s.typeuc == options.typeuc);
            });

            // Check existing posts for message
            if(mapPosts.discussions.posts.length > 0){
                assert.ok(typeof mapPosts.discussions.posts.find(function(post){
                    return (post.msg == options.msg);
                }) === 'undefined', "existing posts do not match");
            }
            return thisTest.manager.startNewTopic(options.typeuc.toLowerCase(), options.graphID, options.msg);
        }).then(function(){
            return thisTest.manager.process(options.state, options.graphID, options.nodes, options.subject);
        }).then(function(discussions){
            // Get map posts
            var mapPosts = discussions.sections.find(function(s){
                return (s.typeuc == options.typeuc);
            });

            // Check existing posts for message
            assert.ok(mapPosts.discussions.posts.length > 0);

            var post = mapPosts.discussions.posts.find(function(post){
                return (post.msg == options.msg);
            });
            assert.ok(typeof post !== 'undefined', "found new post");
            return Promise.resolve(post.id);
        });
    };
    
    /**
     * Deletes and then verfies the deletion of a post
     * 
     */
    pvt.deletePost = function(postid, options, assert){
        var thisTest = this;
        
        return thisTest.manager.deletePost(postid, options.graphID, options.nodes, options.subject).then(function(){
            return thisTest.manager.process(options.state, options.graphID, options.nodes, options.subject);
        }).then(function(discussions){
            // Get map posts
            var mapPosts = discussions.sections.find(function(s){
                return (s.typeuc == "Map");
            });

            // Check existing posts for message
            if(mapPosts.discussions.posts.length > 0){
                assert.ok(typeof mapPosts.discussions.posts.find(function(post){
                    return (post.msg == options.msg);
                }) === 'undefined', "none of the existing posts match");
            }
        });
    };
    
    pvt.runTest = function(assert, test){
        (function(run){
            if(!lock){
                lock = true;
                var done = assert.async(1);
                test().then(function(){
                    lock = false;
                    done();
                });
            }else{
                setTimeout(run, 100);
            }
        })();
    };
    
    pvt.generateRandomString = function(size){
        var text = [];
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < size; i++){
            text.push(possible.charAt(Math.floor(Math.random() * possible.length)));
        }

        return text.join("");
    };
});