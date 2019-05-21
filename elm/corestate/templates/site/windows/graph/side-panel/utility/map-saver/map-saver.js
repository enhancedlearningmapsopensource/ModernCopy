define(["core",
        "activeGraph",
        "mustache",
        "text!./map-saver.html",
        "hub-lib"], 
function(Core,
         ActiveGraph,
         Mustache,
         Template,
         Hub){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {
            "click .save-map-copy": "delegateSaveCopy",
            "click .save-map": "delegateSave"
        },
        
        delegateSave: function(e){
            var thisView = this;
            // Save all node/colors in the map
            // Get active map
            var activeMap = ActiveGraph.getServerModel();
            assert(activeMap.get("creatorid") === userID);
            
            // Get all nodes by color
            var visibleNodes = ActiveGraph.getNodes(appstate);
            var newNodes = ActiveGraph.getNodeColor(appstate, visibleNodes);
            
            // Convert color to number
            newNodes.forEach(function(n){
                n.id = n.node;
                n.color = pvt.colorNum(n.color);
            });
            
            // Get nodes in the saved map
            var oldNodes = Hub.wrap(activeMap).getNodeColorMap();
            
            // Remove same nodes
            function diff(nodeLstA, nodeLstB){
                for(var i = 0; i < nodeLstA.length; i++){
                    var newNode = nodeLstA[i];
                    for(var j = 0; j < nodeLstB.length; j++){
                        var oldNode = nodeLstB[j];
                        if(oldNode.id === newNode.id && oldNode.color === newNode.color){
                            nodeLstA.splice(i,1);
                            nodeLstB.splice(j,1);
                            i--;
                            break;
                        }
                    }
                }
            }
            
            diff(newNodes, oldNodes);
            diff(oldNodes, newNodes);
            
            Hub.sendUserNotification("Saving changes.");
            var lockID = lockSite(true, "map saver - save changes");
            
            // Remove old node connections
            return Promise.all(oldNodes.map(function(node){
                var record = Hub.get("mapnode").findWhere({
                    nodeid:node.id, 
                    mapid:activeMap.id
                });
                return record.destroy({wait:true});
            })).then(function(){
                // Add new node connections
                return Promise.all(newNodes.map(function(node){
                    return Hub.get("mapnode").create({
                        nodeid: node.id,
                        mapid:activeMap.id,
                        color: node.color
                    }, {wait:true});
                }));
            }).then(function(){
                lockSite(false, lockID);
            });
        },
        
        delegateSaveCopy: function(e){
            var thisView = this;
            
            // Get active map
            var activeMap = ActiveGraph.getServerModel();
            
            // Get nodes for active map
            var visibleNodes = ActiveGraph.getNodes(appstate);
            var coloredNodes = ActiveGraph.getNodeColor(appstate, visibleNodes);
            
            var scope = {
                hubmodel: activeMap,
                nodes: coloredNodes
            };
            
            Hub.sendUserNotification("Copying current map.");
            lockID = lockSite(true, "map-saver");
            
            // Create copy of map
            return pvt.createCopy(scope)
                    // Copy the nodes
                    .then(_.bind(pvt.copyNodes, thisView))
                    // Update the page
                    .then(function(){
                        ActiveGraph.loadGraph(appstate, scope.copy.id, {close: true});
                        appstate.set("sidePanel", "My Map Views");
                        lockSite(false, lockID);
                        return Promise.resolve();
                    });
        },
        
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            thisView.listenTo(appstate, "change:activeGraph", thisView.render);
            thisView.listenTo(Hub.get("mapnode"), "update", thisView.render);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {
                clean: true,
                ownedmap: false
            };
            
            // Get the graph state
            var graphManager = application.graphstate;
            if (!graphManager.isEmpty()) {
                // Get the active graph
                var activeGraph = ActiveGraph.getServerModel();
                if(activeGraph !== null && typeof activeGraph !== "undefined"){
                    renderOb.clean = ActiveGraph.isClean();
                    renderOb.ownedmap = (activeGraph.get("creatorid") === userID);
                }
            }
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }
    });
    
    /**
     * Create a copy of the given map in the database.
     * @param {object} scope - the scope
     * @param {HubModel} scope.hubmodel - the map to copy
     * @return {Promise(object)} - the new scope
     */
    pvt.createCopy = function(scope){
        return pvt.copyMap(scope);//.then(_.bind(pvt.copyMapSets));
    };
    
    pvt.copyMap = function(scope){
        var title = "_custom";
        var description = "";
        var searchTerm = "";
        
        // Check to see if there is actually a map loaded.
        if(scope.hubmodel !== null){
            // Determine a title
            title = Hub.stripHtml(scope.hubmodel.get("title")) + "_copy";
            description = Hub.stripHtml(scope.hubmodel.get("description"));
            searchTerm = Hub.stripHtml(scope.hubmodel.get("searchterm"));
            if(typeof Hub.get("map").findWhere({"title": title, "creatorid": userID}, Hub) !== "undefined"){
                var exnum = 2;
                while(typeof Hub.get("map").findWhere({"title": title + "_" + exnum, "creatorid": userID}, Hub) !== "undefined"){
                    exnum++;
                }
                title = title + "_" + exnum;
            }
        }       
        
        // Create a copy from the avaliable values
        return Hub.get("map").create({
            title: title,
            description: description,
            searchterm: searchTerm
        }, {wait: true}).then(function(ret){
            scope.copy = ret;
            return Promise.resolve(scope);
        });
    };
    
    pvt.copyMapSets = function(scope){
        var setRecords = Hub.get("setmap").where({mapid: scope.hubmodel.id}, false, Hub);
        return Promise.all(setRecords.map(function(d){
            return Hub.get("setmap").create({
                mapid: scope.copy.id,
                setid: d.get("setid")
            }, {wait:true});
        })).then(function(ret){
            return Promise.resolve(scope);
        });
    };
    
    /**
     * Create a copy of the given map in the database.
     * @param {object} scope - the scope
     * @param {HubModel} scope.hubmodel - the map to copy
     * @return {Promise(object)} - the new scope
     */
    pvt.copyNodes = function(scope){
        return Promise.all(scope.nodes.map(function(d){
            return Hub.get("mapnode").create({
                mapid: scope.copy.id,
                nodeid: d.node,
                color: pvt.colorNum(d.color)
            }, {wait:true});
        }));
    };
    
    
    pvt.colorNum = function(color){
        switch(color){
            case "red":
                return 1;
            case "blue":
                return 2;
            case "gray":
                return 0;
            case "green":
                return 3;
            case "orange":
                return 4;
            default:
                throw Error("unknown color: " + color);
        }
    };
    
    return View;
});
