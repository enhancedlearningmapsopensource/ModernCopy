define(["activeGraph",
        "jsclass!3rdParty/jsclass/",
        "hub-lib"],
function (ActiveGraph,
          JsClass,
          Hub) {
              
    var pvt = {
        consts: {}
    };
    pvt.consts.RESOURCE_PATH = "https://aaiprdlmpwb.cc.ku.edu/admincopy/pdf.js/web/viewer.html?file=../../lessons/archive/BASHTIMESTAMP/RESOURCEURL?TIMESTAMPNOW#pagemode=bookmarks";
    pvt.consts.NON_PDF_PATH = "https://aaiprdlmpwb.cc.ku.edu/admincopy/lessons/archive/BASHTIMESTAMP/RESOURCEURL";

    

    class ResourceHelper {
        /**
         * Get resources. If the 'show all' option is selected the show all, otherwise show related.
         * @param {boolean} showAll - gets all resources
         * @param {string} subject - active subject
         * @returns {Promise} - resources
         */
        getResources(showAll, options) {
            var thisClass = this;
            if (showAll) {
                return pvt.getAllResources(options);
            } else {
                return pvt.getRelatedResources.call(thisClass, options);
            }
        }
    }
    
    /**
     * Get the link of the resource formatted for correct url
     * @param {ResourceModel} resource - the resource model
     */
    pvt.getLink = function(resource){
        var link = "";
        
        // The resouce has a bashtimestamp so the bash version knows where it is
        if (resource.get("bashtimestamp").localeCompare("n/a") !== 0) {
            // Split on period
            var parts = resource.get("url").split(".");
            var ext = parts[parts.length - 1];
            if(ext.localeCompare("pdf") === 0){
                var unix = Math.round(+new Date()/1000);
                link = pvt.consts.RESOURCE_PATH.replace("BASHTIMESTAMP", resource.get("bashtimestamp")).replace("RESOURCEURL", resource.get("url")).replace("TIMESTAMPNOW", unix);
            }else{
                link = pvt.consts.NON_PDF_PATH.replace("BASHTIMESTAMP", resource.get("bashtimestamp")).replace("RESOURCEURL", resource.get("url"));
            }
        } 
        
        // The resource was uploaded by a user in modern
        else {
            link = "../" + resource.get("url").split("../").join("");
        }
        
        return link;
    };

    pvt.getAllResources = function () {
        var activeSubject = appstate.get("activeSubject");
        var mapsToNodes = null;
        var resourcesToMaps = null;
        var managers = application.datainterface;
        var activeGraphID = ActiveGraph.getGraphID(appstate);
        var subgraphCollection = managers.get("map");
        var nodeCollection = managers.get("node");
        var standardCollection = managers.get("standard");
        var gradeCollection = managers.get("grade");
        var domainCollection = managers.get("domain");
        var subjectCollection = managers.get("subject");
        var resourceMapping = [];
        
        assert(managers.loaded);

        managers.get("resource").forEach(function (resource) {
            var resourceOb = {
                id: resource.id,
                resource: resource.attributes,
                nodes: [],
                maps: [],
                link: false,
                elm: (resource.get("bashtimestamp") != "n/a") ? true : false
            };
            if (resource.hasMaps()) {
                var mapIds = resource.getMapIDs();
                mapIds.forEach(function (mapID) {
                    if (!$.isNumeric(mapID)) {
                        mapID = mapID.id;
                    }

                    // Get the map if it exists
                    if(!subgraphCollection.has(mapID)){
                    	return;
                    }
                    var map = subgraphCollection.get(mapID);

                    // Check the nodes
                    var subject = "";
                    if (!map.hasNodes()) {
                        return;
                    } else {
                        [0,1,2].forEach(function (color) {
                            if (subject.length > 0) {
                                return;
                            }

                            var nodeLst = map.getNodes(color);
                            nodeLst.forEach(function (nodeID) {
                                var node = nodeCollection.get(nodeID);
                                if (subject.length > 0) {
                                    return;
                                } else if (!node.has("sids")) {
                                    return null;
                                } else {
                                    node.getSIDs().forEach(function (sid) {
                                        var standard = standardCollection.get(sid);
                                        if (subject.length > 0) {
                                            return;
                                        } else if (!standard.has("gradeid")) {
                                            return;
                                        } else {
                                            var gradeID = standard.get("gradeid");
                                            var grade = gradeCollection.get(gradeID);
                                            if (!grade.has("subjectid")) {
                                                return;
                                            } else {
                                                var subjectID = grade.get("subjectid");
                                                subject = subjectCollection.get(subjectID).get("name").toLowerCase();
                                            }
                                        }
                                    });
                                }
                            });
                        });
                    }


                    // Add map to display
                    if (subject !== null && subject.toLowerCase() == activeSubject) {
                        resourceOb.maps.push({id: mapID, title: map.get("title")});

                        // Check for active map
                        if(mapID == activeGraphID){
                            resourceOb.link = pvt.getLink(resource);
                        }
                        

                        [0,1,2].forEach(function (color) {
                            var nodesOfColor = map.getNodes(color);
                            nodesOfColor.forEach(function (nodeID) {
                                resourceOb.nodes.push(nodeID);
                            });
                        });
                    }
                });
            }

            if (resourceOb.maps.length > 0) {
                removeDuplicates(resourceOb.nodes);
                resourceMapping.push(resourceOb);
            }
        });

        return Promise.resolve(resourceMapping);

    };
    
    /**
     * Get the maps associated with each node
     * @param {NodeModel} nodes - nodes visible
     * @param {ManagerController} controller - controller
     * @returns {JsClass.Hash}
     */
    pvt.getMapsForNodes = function(nodes, controller){
       var mapsToNodes = new JsClass.Hash();
       var mapCollection = Hub.get("map");
       nodes.forEach(function (n) {
           Hub.wrap(n).mapIDs().forEach(function (mid) {
               if (typeof mid === 'number') {
                   // The map exists so get it from the manager
                   if (mapCollection.has(mid)) {
                       mid = mapCollection.get(mid);
                   }
                   // No map exists so ignore it
                   else {
                       return;
                   }
               }

               if (!mapsToNodes.hasKey(mid.id)) {
                   mapsToNodes.store(mid.id, []);
               }
               mapsToNodes.fetch(mid.id).push(n.id);
           });
       });
       return mapsToNodes;
    };
    
    /**
     * @return {Promise} - related resources
     */
    pvt.getRelatedResources = function (options) {
        var thisView = this;
        options = (!options) ? {} : options;

        var activeSubject = (!options.subject) ? appstate.get("activeSubject") : options.subject;
        var activeGraphID = (!options.graphID) ? ActiveGraph.getGraphID(appstate): options.graphID;
        
        options.controller = (!options.controller) ? application.datainterface : options.controller; 
        var collections = {
            map: Hub.get("map"),
            resource: Hub.get("resource")
        };
        

        // Get the node models for each of the visible circles
        var nodes = (!options.nodes) ? pvt.getVisibleNodes() : options.nodes;

        // Get the maps associated with each node
        var mapsToNodes = pvt.getMapsForNodes(nodes, options.controller);

        // Get all relevant maps
        var maps = mapsToNodes.keys().map(function (d) {
            return collections.map.get(d);
        });

        // Get the resources associated with each map
        var resourcesToMaps = new JsClass.Hash();
        var mapResources = Hub.get("mapresource");
        maps.forEach(function (map) {
            
            // Get resourceids for this map
            var resIDs = mapResources.filter(function(mr){
                return (Number(mr.get("mapid")) === Number(map.id));
            }).map(function(mr){
                return Number(mr.get("resourceid"));
            });
            
            
            // If there are resources
            if (resIDs.length > 0) {
                resIDs.forEach(function (resourceID) {
                    assertType(resourceID, 'number');                    
                    if (!resourcesToMaps.hasKey(resourceID)) {
                        resourcesToMaps.store(resourceID, []);
                    }
                    resourcesToMaps.fetch(resourceID).push(map);
                });
            }
        });

        // Get the resource models
        var resources = resourcesToMaps.keys().map(function (d) {
            return collections.resource.get(d);
        });
        
        
        // Filter out undefined resources
        var definedResources = resources.filter(function(r){
            return (typeof r !== 'undefined');
        });
        resources = null;

        // Map the resources to their respective nodes
        var resourceMapping = [];
        definedResources.forEach(function (resource) {
            var maps = resourcesToMaps.fetch(resource.id);
            var mapInfo = [];
            var nodeIDs = [];
            var isActive = false;
            maps.forEach(function (map) {
                var mapID = map.id;
                if (mapID == activeGraphID) {
                    isActive = true;
                }
                if (!$.isNumeric(map.id)) {
                    throw Error("non numeric");
                }

                mapInfo.push({id: map.id, title: map.get("title")});
                var nodes = mapsToNodes.fetch(mapID);
                nodes.forEach(function (nid) {
                    nodeIDs.push(nid);
                });
            });
            removeDuplicates(nodeIDs);

            if (!$.isNumeric(resource.id)) {
                throw Error("non numeric");
            }
            
            var link = false;
            if(isActive){
                link = pvt.getLink(resource);
            }
            

            resourceMapping.push({
                id: resource.id,
                resource: resource.attributes,
                link: link,
                nodes: nodeIDs,
                maps: mapInfo,
                elm: (resource.get("bashtimestamp") != "n/a") ? true : false
            });
        });
        return Promise.resolve(resourceMapping);
    };
    
    /**
     * Get the node models of all visible circles
     * @returns {NodeModel[]} - a list of the node models for all visible circles ({@see backbone/models/node-model.js})
     */
    pvt.getVisibleNodes = function(){
       var thisView = this;

       // Get the visible node ids
       var nodeIDs = ActiveGraph.getNodes(appstate);

       // Get the collection of all node models
       var nodeCollection = Hub.get("node");

       // Get the models associated to the ids
       return  nodeIDs.map(function (d) {
           return nodeCollection.get(d);
       });
    };


    return new ResourceHelper();
});
