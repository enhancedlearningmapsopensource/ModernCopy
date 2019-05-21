/**
 * Container for the various discussion types (Map, Resource, Node)
 * @param {type} Backbone
 * @param {type} Mustache
 * @param {type} ActiveGraph
 * @param {type} ResourceHelper
 * @return {unresolved}
 */
define(["backbone", 
        "mustache", 
        "activeGraph",
        "resourceHelper",
        "hub-lib"],
function(Backbone, 
         Mustache, 
         ActiveGraph,
         ResourceHelper,
         Hub){
             
    var DiscussionTypeView = Backbone.View.extend({
        events:{
            "change #discussion-type-select": "changeDiscussionType",
            "change #discussion-type-node": "changeDiscussionNode",
            "change #discussion-type-resource": "changeDiscussionResource",
        },
        
        /**
         * Triggered when a user changes the discussion node
         */
        changeDiscussionNode: function(e){
            e.preventDefault();
            var thisView = this;
            var $el = thisView.$el.find("#discussion-type-node");
            
            var nodeID = $el.val();
            thisView.model.set("discussionType", {
                type: thisView.model.get("discussionType").type,
                node: nodeID,
                warn: {
                    node: false,
                    resource: false
                }
            });
        },
        
        /**
         * Triggered when a user changes the discussion resource
         */
        changeDiscussionResource: function(e){
            e.preventDefault();
            var thisView = this;
            var $el = thisView.$el.find("#discussion-type-resource");
            
            var resID = $el.val();
            thisView.model.set("discussionType", {
                type: thisView.model.get("discussionType").type,
                resource: resID,
                warn: {
                    node: false,
                    resource: false
                }
            });
        },
        
        /**
         * Triggered when a user changes the discussion type
         */
        changeDiscussionType: function(e){
            e.preventDefault();
            var thisView = this;
            var $el = thisView.$el.find("#discussion-type-select");
            
            var type = $el.val();
            thisView.model.set("discussionType", {
                type: type,
                warn: {
                    node: false,
                    resource: false
                }
            });
            thisView.render();
        },
        
        /**
         * Get the discussion node
         * @return {number} - the discussion node id
         */
        getNode: function(){
            return assertType(Number(this.model.get("discussionType").node), "number");
        },
        
        /**
         * Get the discussion resource
         * @return {number} - the discussion resource id
         */
        getResource: function(){
            return assertType(Number(this.model.get("discussionType").resource), "number");
        },
        
        /**
         * Get the discussion type
         * @return {string} - the discussion type
         */
        getType: function(){
            return this.model.get("discussionType").type;
        },
        
        initialize: function(options){
            var thisView = this;
            thisView.model.set("discussionType",{
                type: "map",
                warn: {
                    node: false,
                    resource: false
                }
            });
        },
        
        /**
         * Check to see if we should offer to create new topics
         * @returns {Promise}@returns {Promise.boolean} - true if there is anything with which to have a discussion, otherwise false.
         */
        hasTypes: function(){
            var thisView = this;
            return Promise.all([ActiveGraph.getGraphServerModel(thisView.model), ResourceHelper.getResources(false), ActiveGraph.getNodes(thisView.model)]).then(function(results){
                var graph = results[0];
                var resources = results[1];
                var nodes = results[2];
                
                return Promise.resolve(graph !== null || resources.length > 0 || nodes.length > 0);
            });
        },
        
        /**
         * Render
         * @returns {Promise.boolean} - true if there is anything with which to have a discussion, otherwise false.
         */
        render: function(){
            var thisView = this;
            var programState = thisView.model.get("programState");
            var serverModel = ActiveGraph.getGraphServerModel();
                
            var visibleNodeIDs = ActiveGraph.getNodes(programState);
            var currType = thisView.model.get("discussionType").type;
            var typeOptions = [];

            // Show map option if map is saved
            if(serverModel !== null){
                typeOptions.push({
                    name: "Map (" + Hub.stripHtml(serverModel.get("title")) + ")",
                    value: "map"
                });
            }else if(currType === "map"){
                thisView.model.get("discussionType").type = "node";
                currType = "node";
            }

            // Show node option if nodes are present
            if(visibleNodeIDs.length > 0){
                typeOptions.push({
                    name: "Node",
                    value: "node"
                });
            }


            if(currType === "node"){
                // Get list of visible node text ids
                var nodeCollection = Hub.get("node");
                var visibleNodes = visibleNodeIDs.map(function(nodeID){
                    var node = nodeCollection.get(nodeID);
                    return {
                        id: node.id,
                        textid: Hub.stripHtml(node.get("textid")),
                        desc: Hub.stripHtml(Hub.wrap(node).title(true, false))
                    };
                });
                visibleNodes.sort(function(a,b){
                    return a.textid.localeCompare(b.textid);
                });
            }

            var resourcePromise = ResourceHelper.getResources(false);
            return resourcePromise.then(function(resources){
                // Show resource option if any resources exist
                if(resources.length > 0){
                    typeOptions.push({
                        name: "Resource",
                        value: "resource"
                    });
                }

                typeOptions.forEach(function(d){
                    d.selected = (d.value === currType);
                });

                var data = {
                    type: currType,
                    nodes: (currType === "node") ? visibleNodes : false,
                    resources: (currType === "resource") ? resources.map(function(d){
                        return {
                            id: d.resource.id,
                            desc: Hub.stripHtml(d.resource.title)
                        };
                    }) : false,
                    types: typeOptions,
                    nodewarning: thisView.model.get("discussionType").warn.node,
                    reswarning: thisView.model.get("discussionType").warn.resource
                };

                thisView.$el.html(Mustache.render(thisView.model.get("template"), data));

                return Promise.resolve(typeOptions.length > 0);
            });
        }, 
        
        validate: function(){
            var thisView = this;
            var discussionType = thisView.model.get("discussionType");
            var currType = discussionType.type;
            
            discussionType.warn.node = false;
            discussionType.warn.resource = false;
            
            switch(currType){
                case "map": break;
                case "node":
                    var node = discussionType.node;
                    var node = discussionType.node;
                    if(typeof node === 'undefined'){
                        discussionType.warn.node = true;
                    }
                    break;
                case "resource":
                    var resource = discussionType.resource;
                    if(typeof resource === 'undefined'){
                        discussionType.warn.resource = true;
                    }
                    break;
                default:
                    throw Error("unknown discussion type:" + currType);
            }
            
            return !(Object.keys(discussionType.warn).reduce(function(acc, k){
                return acc || discussionType.warn[k];
            }, false));
        }
    });
    
    return DiscussionTypeView;
});
