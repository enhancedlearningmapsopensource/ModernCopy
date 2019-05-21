/* global pvt */

/**
 * Discussion manager to interface with the database and produce Mustache-ready object for
 * display.
 */

define(["resourceHelper",
        "jsclass!3rdParty/jsclass/",
        "hub-lib"], 
function(ResourceHelper,
         JsClass,
         Hub){
    var pvt = {
        consts: {
            COLLECTION_TYPES: ["nodes", "posts", "discussions", "maps", "resources"]
        }
    };
    
    class DiscussionManager{
        /**
         * 
         * @param {ManagerController} controller - the manager controller
         */
        constructor(controller){
            var thisClass = this;
            
            assertDefined(Hub);
            thisClass.controller = Hub;
        }
        
        /**
         * Delete the post
         * @param {number} postID - post id to delete
         * @return {Promise}
         */
        deletePost(postID, graphID, nodes, subject){
            var thisClass = this;
            
            // Get the post
            var post = thisClass.controller.get("post").get(postID);
            
            // Mark as deleted
            post.set("datedeleted", "now");
            return post.save();
        }
        
        /**
         * Edit a map post
         * @param {type} postID
         * @param {type} graphID
         * @param {type} nodes
         * @param {type} subject
         * @param {type} msg
         * @returns {unresolved}
         */
        editPost(postID, graphID, nodes, subject, msg) {
            var thisClass = this;
            var post = thisClass.controller.get("post").get(postID);
            
            // Edit
            return Hub.wrap(post).edit(msg);
        };
        
        initialState(){
            return {
                repOpen: new JsClass.Set(),
                editOpen: new JsClass.Set(),
                delOpen: new JsClass.Set(),
                repDiagOpen: new JsClass.Set(),
                editDiagOpen: new JsClass.Set(),
                delDiagOpen: new JsClass.Set(),
                sections: {
                    map: true,
                    node: true,
                    resource: true
                }
            };
        }
        
        /**
         * 
         * @param {number} graphID
         * @param {number[]} nodes
         * @param {string} subject
         * @returns {Object}
         */
        process(state, graphID, nodes, subject){
            var thisClass = this;
            return pvt.findDiscussions.call(thisClass, graphID, nodes, subject).then(function(discussions){
                var postCollection = thisClass.controller.get("post");
                
                assertDefined(discussions);
                // Check for holes in the map posts
                if(discussions.map !== null){
                    var toRemove = Hub.wrap(discussions.map).getPostIDs().filter(function(postID){
                        var post = postCollection.get(postID);
                        return (!post || post.has("error") || (post.get("datedeleted") !== TIME_ZERO && post.get("datedeleted") !== "0000-00-00 00:00:00" && post.get("datedeleted") !== null));
                    });
                    if(toRemove.length > 0){
                        toRemove.forEach(function(r){
                            var postIDs = (new JsClass.Set(discussions.map.getPostIDs()));
                            postIDs.remove(r);
                            postIDs = postIDs.map(function(d){
                                return d;
                            });
                            discussions.map.set("postids", postIDs);
                        });
                    }
                    
                    
                    var formatted = null;
                    formatted = pvt.formatMapPosts.call(thisClass, Hub.wrap(discussions.map).getPostIDs());
                    discussions.map.set("formatted", formatted);
                }   

                // Format node posts for display
                discussions.nodes = discussions.nodes.map(function(node){
                    node.set("formatted", pvt.formatMapPosts.call(thisClass, Hub.wrap(node).getPostIDs()));
                    return node;
                });

                // Format resource posts for display
                if(discussions.resources !== null){
                    discussions.resources = discussions.resources.map(function(resource){
                        resource.set("formatted", pvt.formatMapPosts.call(thisClass, Hub.wrap(resource).getPostIDs()));
                        return resource;
                    });
                }

                pvt.mergeState.call(thisClass, discussions, state);
                return pvt.formatData.call(thisClass, discussions, state);
            });
            
            if(ERR_REP){//ERR_REP
                pr.catch(function(err){ 
                    var internalStack = err.stack.split("\n").map(function(d){return d.trim();});
                    internalStack.shift();
                    if(internalStack[internalStack.length - 1].localeCompare("at <anonymous>") === 0){
                        internalStack.pop();
                    }
                    return Promise.reject({message: err.message, internal: internalStack});
                });
            }
            
            
            return pr;
        }
        
        reply(postID, graphID, nodes, subject, msg){
            var thisClass = this;
            
            // Find the post
            
            return Hub.wrap(thisClass.controller.get("post").get(postID)).reply(msg,{
                originalid: postID,
                dataInterface: thisClass.controller
            });
            
            return pvt.findDiscussions.call(thisClass, graphID, nodes, subject).then(function(discussions){
                var flattened = [discussions.map].concat(discussions.nodes).concat(discussions.resources).filter(function(d){
                    return (d !== null);
                });

                var discussion = flattened.find(function(d){
                    var post = d.getPostIDs().find(function(p){
                        return (p == postID);
                    });
                    return (typeof post !== 'undefined' && post !== null);
                });
                return Promise.resolve(discussion);
            })

            // Add the post
            .then(function(discussion){
                return discussion.addPost(msg, {
                    originalid: postID,
                    dataInterface: thisClass.controller
                });
            });
        }
        
        /**
         * Start a new topic
         * @param {string} - type of topic to add
         * @param {number} - id of object to add
         * @returns {Promise}
         */
        startNewTopic(obtype, obid, msg){
            var thisClass = this;
            return pvt.addPost.call(thisClass, obtype, obid, msg, null);
        }
    }
    
    /**
     * Add a post to a disucssion object
     * @param {string} type - type of dicussion object
     * @param {number} id - id of discussion object
     * @param {string} msg - message to add
     * @param {number|null} replytoid - reply id if one exists
     * @returns {Promise}
     */
    pvt.addPost = function (type, id, msg, replytoid) {
        var thisClass = this;

        assertType(type, "string");
        assertType(id, "number");
        assertType(msg, "string");
        assert(replytoid === null || typeof replytoid === 'number');
        replytoid = (replytoid === null) ? -1 : replytoid;

        return pvt.getDiscussion.call(thisClass, id, type).then(function(discussion){
            if(typeof discussion === "undefined" || discussion === null){
                // Create new discussion
            }
            return Hub.wrap(discussion).addPost(msg, {
                originalid: replytoid,
                dataInterface: thisClass.controller
            });
        });
    };
    
    pvt.closeAll = function (post) {
        post.repOpen = false;
        post.editOpen = false;
        post.delOpen = false;
        if (post.hasOwnProperty("numreplies") && post.numreplies > 0) {
            post.replies.forEach(function (rep) {
                pvt.closeAll(rep);
            });
        }
    }; 
    
    /**
     * Filter out posts that do not have a valid creator.
     * @param {number[]} posts - ids of posts
     * @return {number[]} - ids of posts with valid creators
     */
    pvt.filterNoCreatorPosts = function(posts){
        var thisClass = this;
        
        // Get collections
        var postCollection = thisClass.controller.get("post");
        var userCollection = thisClass.controller.get("user");
        
        //throw Error("testing reporting");
        
        // Filter
        return posts.filter(function(p){
            assert(postCollection.has(p), "cannot filter post. Post with id='" + p + "' does not exist.");
            
            // Get the post
            var post = postCollection.get(p);
            
            // Get the creator id
            var creatorID = post.get("creatorid");
            
            // Check to see if the creatorid matches an existing user
            return thisClass.controller.get("user").has(creatorID);
        });
    };
    
    
    /**
     * 
     * @returns {Promise<Object>}
     */
    pvt.findDiscussions = function(graphID, visibleNodes, subject){
        var thisClass = this;
        
        var scope = {
            create: false,
            graphID: graphID,
            nodeIDs: visibleNodes,
            subject: subject
        };
        
        // Get discussions
        return Promise.all([
            pvt.findMapDiscussions.call(thisClass, scope),
            pvt.findNodeDiscussions.call(thisClass, scope),
            pvt.findResources.call(thisClass, scope)
                    .then(_.bind(pvt.findResourceDiscussions, thisClass, scope))
        ])
        // Success Handler
        .then(function(results){
            results = results.map(function(d){
                if(d !== null && $.isArray(d)){
                    return d.filter(function(p){
                        return (Hub.wrap(p).getPostIDs().length > 0);
                    });
                }else{
                    return d;
                }
            });

            return Promise.resolve({
                map: results[0],
                nodes: results[1],
                resources: results[2]
            });
        });


        

        // Get the discussions for resources associated with the map
        

        return Promise.all([mapDisc, nodeDiscs, resDiscs]).then(function(results){
            results = results.map(function(d){
                if(d !== null && $.isArray(d)){
                    return d.filter(function(p){
                        return (p.getPostIDs().length > 0);
                    });
                }else{
                    return d;
                }
            });

            return Promise.resolve({
                map: results[0],
                nodes: results[1],
                resources: results[2]
            });
        });
   };
   
   /**
    * Find all discussions associated the active map
    * @param {number} options.graphID - the id of the active map
    * @param {boolean} options.create - whether to create a discussion if one does not exist
    * @return {Promise.Object[]}
    */
   pvt.findMapDiscussions = function (options) {
        var thisClass = this;
        if(!$.isNumeric(options.graphID)){
            return Promise.resolve(null);
        }
        
        // Validate
        assertExists(options);
        assertType(options.graphID, "number");
        assertType(options.create, "boolean");
        
        // Get the current map
        var map = thisClass.controller.get("map").get(options.graphID);
        
        // Get Promise (Find discussions for object)
        return pvt.findObjectDiscussion.call(thisClass, "map", options.graphID, options.create).then(function(mapDisc){
            // Success handler
            if(mapDisc !== null){
                assertDefined(mapDisc);
                mapDisc.set("serverModel", map);
            }
            return mapDisc;
        });
   };
   
   /**
    * Find all discussions associated the given nodes
    * @param {number[]} options.nodeIDs - the ids of the nodes
    * @param {boolean} options.create - whether to create a discussion if one does not exist
    * @return {Promise.Object[]}
    */
   pvt.findNodeDiscussions = function(options){
        var thisClass = this;
        
        // Validate
        assertExists(options);
        assertType(options.nodeIDs, "number[]");
        assertType(options.create, "boolean");
        
        // Get the discussions for nodes associated with the map
        var nodeCollection = thisClass.controller.get("node");
        assertDefined(nodeCollection);
        
        // Get Promise (find node discussions)
        return Promise.all(options.nodeIDs.map(function(nodeID){
            return pvt.findObjectDiscussion.call(thisClass, "node", nodeID, options.create);
        })).then(function(results){
            // Filter out invalid nodes
            var validNodes = results.filter(function(node){
                return (node !== null);
            });
            
            // Attach server models and add to discussions
            validNodes.forEach(function(node){
                node.set("serverModel", nodeCollection.get(node.get("obid"))); 
            });
            return validNodes;
        });
   };
   
   /**
    * Find all resources
    * @param {string} options.subject - the subject (e.g. math)
    * @param {number[]} options.nodeIDs - node ids
    * @param {number} options.grpahID - graph id
    * @return {Promise.Object[]}
    */
   pvt.findResources = function(options){
        var thisClass = this;
        if(!$.isNumeric(options.graphID)){
            return Promise.resolve(null);
        }
        
        // Validate
        assertExists(options);
        assertType(options.subject, "string");
        assertType(options.nodeIDs, "number[]");
        assertType(options.graphID, "number");
        
        var resOptions = {
            subject: options.subject,
            controller: thisClass.controller,
            nodes: options.nodeIDs.map(function(nid){
                return thisClass.controller.get("node").get(nid);
            }),
            graphID: options.graphID
        };
        
        // Get resource collection
        var resourceCollection = assertDefined(thisClass.controller.get("resource"));
        
        // Get resources associated with the given options
        return ResourceHelper.getResources(false, resOptions).then(function(resources){
            options.resources = resources;
            return resources;
        });
   };
   
   /**
    * Find all discussions associated the given resources
    * @param {number[]} options.resourceIDs - the ids of the resources
    * @param {boolean} options.create - whether to create a discussion if one does not exist
    * @return {Promise.Object[]}
    */
   pvt.findResourceDiscussions = function(options){
        var thisClass = this;
        if(!$.isNumeric(options.graphID)){
            return Promise.resolve(null);
        }
        
        // Validate
        assertExists(options);
        assertType(options.create, "boolean");
        assertExists(options.resources);
        assert($.isArray(options.resources));
        
        // Find all discussions for all resources in the list
        return Promise.all(options.resources.map(function(res){
            return pvt.findObjectDiscussion.call(thisClass, "resource", res.id, options.create);
        })).then(function(results){
            var filteredRes = results.filter(function(r){
                return (r !== null);
            });
            
            // Get resource collection (lazy)
            var resourceCollection = assertDefined(thisClass.controller.get("resource"));
            
            return filteredRes.map(function(resourceDiscussion){
                resourceDiscussion.set("serverModel", resourceCollection.get(resourceDiscussion.get("obid"))); 
                return resourceDiscussion;
            });
        });
   };
   
   /**
    * Find the dicussion post. If none exists then create it.
    * @param {string} type - discussion focus object type
    * @param {number} id - discussion focus object id
    * @param {boolean} create - creates a new post if none can be found
    * @returns {Promise.null} - if the id is not valid
    * @returns {Promise.DiscussionModel} - otherwise
    */
    pvt.findObjectDiscussion = function (type, id, create) {
        var thisClass = this;

        assertType(id, "number");
        assertType(type, "string");
        assertType(create, "boolean");

        var discussionCollection = thisClass.controller.get("discussion");
        var discussionPost = thisClass.controller.getWhere("discussion", {obid: id, obtype: type});

        if (discussionPost.length > 1) {
            throw Error("too many matches");
        } else if (discussionPost.length == 0) {
            if(create){
                return discussionCollection.create({obid: id, obtype: type}).then(function () {
                    return pvt.findDiscussion.call(thisView, type, id);
                }).catch(function (err) {
                    throw Error("may already be a post");
                });
            }else{
                return Promise.resolve(null);
            }
        } else {
            return Promise.resolve(discussionPost[0]);
        }
    };
    
    
    /**
     * Format data for output to mustache
     * @param {Object} data - mustache data
     */
    pvt.formatData = function(data, state){
        var formatted = {};
        
        formatted.sections = [];
        
        // Map section
        formatted.sections.push({
            typeuc: "Map",
            id: "section-map",
            open: state.sections.map,
            hasdiscussions: (data.map !== null && data.map.get("formatted").length > 0),
            discussions: (data.map !== null) ? {
                name: Hub.stripHtml(data.map.get("serverModel").get("title")),
                posts: data.map.get("formatted")
            } : []
        });
        
        // Node section
        formatted.sections.push({
            typeuc: "Node",
            id: "section-node",
            open: state.sections.node,
            hasdiscussions: (data.nodes.reduce(function(acc,val){
                return acc + val.get("formatted").length;
            }, 0) > 0),
            discussions: data.nodes.map(function(dis){
                return {
                    name: Hub.wrap(dis.get("serverModel")).title(true, false),
                    posts: dis.get("formatted")
                };
            })
        });
        
        // Resource section
        formatted.sections.push({
            typeuc: "Resource",
            id: "section-resource",
            open: state.sections.resource,
            hasdiscussions: (data.resources !== null && data.resources.reduce(function(acc,val){
                return acc + val.get("formatted").length;
            }, 0) > 0),
            discussions: (data.resources !== null) ? data.resources.map(function(dis){
                return {
                    name: dis.get("serverModel").get("title"),
                    posts: dis.get("formatted")
                };
            }) : []
        });
        
        return formatted;
    };
    
    pvt.formatMapPost = function(post){
        var thisClass = this;
        var postCollection = thisClass.controller.get("post");
        var msgCollection = thisClass.controller.get("msg");
        
        // Get the creator
        var creatorID = post.get("creatorid");
        var creator = thisClass.controller.get("user").get(creatorID);
        assertExists(creator, "Creator with id: " + creatorID + " does not exist.");
        
        var mapped = {
            user: creator.get("email"),
            id: post.id,
            date: post.get("datecreated"),
            edits: Hub.wrap(post).getMIDs().map(function (e) {
                if(msgCollection.has(e)){
                    var edit = msgCollection.get(e);
                    return {
                        date: edit.get("datecreated"),
                        msg: edit.get("msg")
                    };
                }else{
                    return null;
                }
            }).filter(function(e){
                return (e !== null);
            }),
            canedit: (Number(post.get("creatorid")) === Number(userID) || 1 === Number(userID)),
            replyids: (post.has("replyids")) ? post.getReplyIDs(): []
        };

        mapped.msg = "";
        var mids = Hub.wrap(post).getMIDs();
        if(mids.length > 0){
            var lastMID = mids[mids.length - 1];
            if(msgCollection.has(lastMID)){
                var msg = msgCollection.get(lastMID);
                mapped.msg = msg.get("msg");
            }
        }

        if (post.has("originalid") && post.get("originalid") !== null) {
            mapped.parent = post.get("originalid");
        } else {
            mapped.parent = -1;
        }
        return mapped;
    };
    
    /**
     * 
     * @param {type} posts
     * @returns {Promise}
     */
    pvt.formatMapPosts = function (posts) {
        var thisClass = this;
        //pvt.destroyAllTinyMce.call(thisView);
        var postCollection = thisClass.controller.get("post");
        var msgCollection = thisClass.controller.get("message");
        
        assertType(posts, 'number[]');
        
        // Filter out posts that don't exist
        var existingPosts = posts.filter(function (postID) {
            return postCollection.has(postID);
        });
        
        // Filter out posts that don't have valid creators
        var createdPosts = pvt.filterNoCreatorPosts.call(thisClass, existingPosts);

        // Format posts
        var postFilter = createdPosts.map(function (postID) {
            return pvt.formatMapPost.call(thisClass, postCollection.get(postID));
        });

        function strip(html) {
            var tmp = document.createElement("DIV");
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || "";
        }
        
        // Make sure each post is a root
        var final = [];
        var inFinal = new JsClass.Set();
        var roots = postFilter.filter(function(p){
            return (p.parent === -1 || !postCollection.has(p.parent));
        }).forEach(function(d){
            final.push(d);
            sealReply(d, 0);
        });
        
        // Seal the replies and set the level
        function sealReply(post, lvl){
            if(inFinal.contains(post.id)){
                console.warn("already in the final list");
                return;
            }
            
            // Add to final list
            //inFinal.add(post.id);
            
            
            // Format the post
            post.msg = strip(post.msg);
            if(post.replyids.length > 0){
                post.numreplies = post.replyids.length;
                post.singlereply = (post.replyids.length == 1);
                post.replies = [];
                post.replyids.forEach(function (repid) {
                    if(!postCollection.has(repid)){
                        throw Error("Replyid is invalid. request fresh data.");
                    }
                    var reply = postCollection.get(repid);                    
                    var formattedReply = pvt.formatMapPost.call(thisClass, reply);
                    sealReply(formattedReply, lvl + 1);
                    post.replies.push(formattedReply);
                });
            }else{
                post.replies = false;
                post.numreplies = false;
            }
            
            post.lvl = lvl;
            var lastEdit = post.edits.length - 1;
            post.msg = (lastEdit < 0) ? "" : strip(post.edits[lastEdit].msg);
            post.lvl = lvl;
            post.numedits = 0;
            post.singleedit = false;

            if (post.edits.length > 1) {
                post.numedits = post.edits.length - 1;
                post.singleedit = (post.edits.length == 1);
                post.edits[0].date = post.date;
                post.edits[0].id = "Original Post"
                post.edits[0].msg = strip(post.edits[0].msg);
                for (var e = 1; e < post.edits.length; e++) {
                    post.edits[e].id = "Edit " + (e - 1);
                    post.edits[e].msg = strip(post.edits[e].msg);
                }
            }
        }
        
        return final;
    };
    
    /**
     * Get the discussion if one exists, otherwise create one and return it
     * @param {number} obid - id of the target object
     * @param {string} obtype - type of the target object (map|node|resource)
     * @return {Promise.DiscussionModel}
     */
    pvt.getDiscussion = function(obid, obtype){
        var thisClass = this;
        
        assertType(obtype, "string");
        assertType(obid, "number");
        
        var discussionCollection = thisClass.controller.get("discussion");
        var options = {};
        options.obid = Number(obid);
        options.obtype = obtype;

        var existingDiscussion = discussionCollection.findWhere(options); 
        
        // If discussion exists return it, otherwise create new and return that
        if (!existingDiscussion) {
            return discussionCollection.create(options, {wait:true}).then(function(newDisc){
                return discussionCollection.get(newDisc.id);
            });
        }else{
            return Promise.resolve(existingDiscussion);
        }
    };
    
    pvt.recoverDiscussions = function(discussions){
        
    };
    
    pvt.mergeState = function (tree, state) {
        var thisClass = this;
        if (!tree) {
            return;
        }

        //var state = thisView.model.get("programState").get("discussionState");
        //state = {repOpen:[19], editOpen:[19]};

        var flattened = ([tree.map].concat(tree.nodes).concat(tree.resources)).filter(function(discussion){
            return discussion !== null;
        }).map(function(discussion){
            return discussion.get("formatted");
        }).filter(function(postList){
            return (postList.length > 0);
        }).reduce(function(acc,val){
            return acc.concat(val);
        },[]);

        flattened.forEach(function (post) {
            pvt.closeAll(post);
        });

        flattened.forEach(function (post) {
            pvt.openState(post, state);
        });
        var k = 0;
    };
    
    pvt.openState = function (post, state) {
        // Check reply
        if(state.repOpen.contains(post.id)){
            post.repOpen = true;
            if (post.hasOwnProperty("numreplies") && post.numreplies > 0) {
                post.replies.forEach(function (rep) {
                    pvt.openState(rep, state);
                });
            }
        }
        
        // Check edit
        if(state.editOpen.contains(post.id)){
            post.editOpen = true;
        }
        
        // Check delete
        if(state.delOpen.contains(post.id)){
            post.delOpen = true;
        }
        
        // Check diags
        post.showbuttons = true;
        ["rep","del","edit"].forEach(function(t){
            if(state[t + "DiagOpen"].contains(post.id)){
                post[t + "DiagOpen"] = true;
                post.showbuttons = (t == "del") ? post.showbuttons : false;
            }
        });
        
    };
    
    return DiscussionManager;
});


