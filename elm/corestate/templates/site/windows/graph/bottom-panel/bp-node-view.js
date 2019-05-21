define(["backbone",
        "mustache",
        "text!./bottom-panel-node-template.html",
        "hub-lib",
        "activeGraph",
        "jsclass!3rdParty/jsclass/"], 
function(Backbone,
         Mustache,
         Template,
         Hub,
         ActiveGraph,
         JsClass){
    var pvt = {};
    var Panel = Backbone.View.extend({
        template: Template,
        events: {
            "click a.bot-standard": "delegateClickBotStandard",
            "click a.bot-tag": "delegateClickBotTag",
            "click .c-icon": "delegateClickCircleIcon"
        },
        
        delegateClickBotStandard: function(e){
            e.preventDefault();
            appstate.set("standardClicked", $(e.currentTarget).html().trim());
        },
        
        delegateClickBotTag: function(e){
            var thisView = this;
            e.preventDefault();
            var $el = $(e.currentTarget);
            var tag = $el.html().split(" ")[0];
            var nodes = pvt.getNodeIDsWithTag.call(thisView, tag);
            
            var graphManager = application.graphstate;
            graphManager.destroy();
            
            // Set the graphID of the currently active graph
            graphManager.push(graphManager.create("tag_" + tag));
            
            var graphDef = graphManager.get();
            nodes.forEach(function(node){
                graphDef.setNodeColor(node.id, "blue");
            });
            graphManager.set(graphDef);
            
            return graphManager.apply();
        },
        
        delegateClickCircleIcon: function(e){
            var thisView = this;
            var $el = $(e.currentTarget);
            var id = $el.attr("id");
            var nodeID = Number(id.split("-")[1]);
            var circleType = id.split("-")[0];
            var color = null;
            
            if (circleType === "SbluM") {
                color = "blue";
            } else if (circleType === "SredM") {
                color = "red";
            } else if (circleType === "SgreM") {
                color = "gray";
            }

            var graphManager = application.graphstate;
            var graphDef = graphManager.get();
            graphDef.setNodeColor(nodeID, color);
            graphManager.set(graphDef);
            graphManager.apply();
            return thisView.render();
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Mustache.parse(thisView.template);
            
            thisView.listenTo(appstate.get("selectedcircles"), "update", function(model, options){
                thisView.render();
            });
            thisView.listenTo(appstate.get("selectedcircles"), "reset", function(model, options){
                thisView.render();
            });
            
            var collectionsToWatch = [
                "edge",
                "node",
                "nodestandard",
                "map",
                "mapnode",
                "simplestandard"
            ];
            collectionsToWatch.forEach(function(d){
                thisView.listenTo(Hub.get(d), "update", function(model, options){
                    thisView.render();
                });
                thisView.listenTo(Hub.get(d), "change", function(model, options){
                    thisView.render();
                });
            });
            
            
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            
            // Get the program state & significant properties
            var programState    = appstate;
            var circleSelected  = programState.get("selectedcircles");
            circleSelected = (circleSelected.length === 1) ? circleSelected.at(0).id : null;
            
            var dataInterface   = application.datainterface;
            var activeSubject   = programState.get("activeSubject");
            
            // Exit if no circle selected or node doesn't exist
            if(circleSelected === null || !Hub.get("node").has(circleSelected)){
                thisView.$el.hide();
                return;
            }
            
            // Get preferences
            var showNodeID = pvt.showNodeID.call(thisView);
            
            // Get the node
            var currNode = Hub.get("node").get(circleSelected);
            
            // Get parents & children
            var parentIDs = Hub.wrap(currNode).getParentIDs();
            var childrenIDs = Hub.wrap(currNode).getChildrenIDs();
            
            /*if(parents.length > 0 || Hub.get("edge").length > 0){
                parents = Hub.wrap(currNode).getParentIDs();
                throw Error();
            }*/
            
            // Get maps
            var maps = (Hub.get("map").length > 0) ? Hub.wrap(currNode).getMaps() : [];
            
            // Get standards
            var standards = (Hub.get("simplestandard").length > 0) ? Hub.wrap(currNode).getStandards() : [];            
            
            // Determine hidden parents/children 
            return Promise.resolve().then(function(){
                var graphManager = application.graphstate;
                if (!graphManager.isEmpty()) {
                    return ActiveGraph.getNodes(thisView.model);
                } else {
                    return Promise.resolve([]);
                }

            }).then(function (nodeIDs) {
                var visible = new JsClass.Set(nodeIDs);
                var hiddenParentIDs = (new JsClass.Set(parentIDs)).difference(visible).toArray();
                var hiddenChildrenIDs = (new JsClass.Set(childrenIDs)).difference(visible).toArray();

                var parents = Hub.getModels("node", hiddenParentIDs);
                var children = Hub.getModels("node", hiddenChildrenIDs);


                var isCurrVisible = (nodeIDs.filter(function (d) {
                    return d === currNode.id;
                }) > 0);

                //var nodeTitle = pvt.getNodeTitle(currNode, showNodeID);
                var nodeDescription = pvt.getNodeDescription(currNode);

                var table = {
                    description: nodeDescription,
                    isvisible: isCurrVisible
                };
                table.frames = [];

                var section = null;
                var frame = null;

                // Set up the left frame
                frame = {id: "left", sections: [], smalllist: true};
                table.frames.push(frame);

                // Set up standard section 
                // Format
                standards = standards.map(function (d) {
                    return {val: Hub.stripHtml(Hub.get("simplestandard").get(d.id).get("textid"))};
                });
                
                // Create
                frame.sections.push({
                    name: "Standards",
                    sectionwidth: 3,
                    firstvalue: standards.shift(),
                    linkclass: "bot-standard",
                    sectionlist: standards
                });


                // Prepare maps for display
                var preparedMaps = pvt.prepareMaps(maps);

                //Set up maps section 
                frame.sections.push({
                    name: "Map Views",
                    sectionwidth: 3,
                    firstvalue: preparedMaps.shift(),
                    linkclass: "bot-map",
                    sectionlist: preparedMaps
                });


                // Prepare tags for display
                //if(false){
                    var tags = pvt.prepareTags.call(thisView, currNode);

                    // Set up tags section
                    frame.sections.push({
                        name: "Tags",
                        sectionwidth: 3,
                        firstvalue: tags.shift(),
                        linkclass: "bot-tag",
                        sectionlist: tags
                    });
                //}

                /**
                 * Set up the right frame
                 */
                frame = {id: "right", sections: [], smalllist: false};
                table.frames.push(frame);

                /**
                 * Filter out undefined parents/children
                 */
                parents = parents.filter(function(d){
                    return (typeof d !== "undefined");    
                });
                children = children.filter(function(d){
                    return (typeof d !== "undefined");    
                });

                /**
                 * Set up hidden parents 
                 */
                //var parentNodes = relatives[0].nodes;

                // Format parent & children output
                parents = parents.map(function (d) {
                    return {
                        val: (((showNodeID) ? Hub.stripHtml(d.get("textid")) + " " : "") + d.get("title")).replaceAll("[i]", "<em>").replaceAll("[/i]", "</em>"),
                        linkid: d.id
                    };
                });
                children = children.map(function (d) {
                    return {
                        val: (((showNodeID) ? Hub.stripHtml(d.get("textid")) + " " : "") + d.get("title")).replaceAll("[i]", "<em>").replaceAll("[/i]", "</em>"),
                        linkid: d.id
                    };
                });
                
                if(parents.length > 0){
                    var k = 0;
                }



                // Construct parent section
                frame.sections.push({
                    circlelist: true,
                    name: 'Hidden Parents',
                    sectionwidth: 9,
                    firstvalue: parents.shift(),
                    linkclass: "bot-parent",
                    sectionlist: parents
                });

                // Construct child section
                frame.sections.push({
                    circlelist: true,
                    name: 'Hidden Children',
                    sectionwidth: 9,
                    firstvalue: children.shift(),
                    linkclass: "bot-child",
                    sectionlist: children
                });
                
                

                // Filter out empty sections
                table.frames.forEach(function (d) {
                    d.sections = d.sections.filter(function (sec) {
                        return (typeof sec.firstvalue !== 'undefined' &&
                                typeof sec.firstvalue.val !== 'undefined' &&
                                sec.firstvalue !== null &&
                                sec.firstvalue.val !== null);
                    });
                });

                table.frames.forEach(function (fr) {
                    fr.sections.forEach(function (sec) {
                        if (sec.sectionlist.length > 2) {
                            sec.numextra = sec.sectionlist.length - 2;
                            for (var sIndex = 2; sIndex < sec.sectionlist.length; sIndex++) {
                                sec.sectionlist[sIndex].extra = true;
                            }
                        }
                    });
                });
                
                
                var renderOb = {};
                table.path = gRoot;
            
                var $el = $(Mustache.render(thisView.template, table));
                thisView.$el.after($el);
                thisView.$el.remove();
                thisView.setElement($el[0]);
            });
        }
    });
    
    /**
     * Get the node description formatted for visible output
     * @param {NodeModel} currNode - the current node
     * @return {string}
     */
    pvt.getNodeDescription = function(currNode){
        return stripItags(currNode.get("shorttitle"));
    };
    
    
    
    pvt.showNodeID = function(){
        var pref = getPreference("NODEID_ON");
        if(pref === null){
            throw Error("Cannot find preference: NODEID_ON");
        }
        return (pref.localeCompare("t") === 0);
    };
    
    /**
     * Prepare list of map models for display in the panel
     * @param {MapModel[]} maps - the map models
     * @return {Object[]} - formatted maps
     */
    pvt.prepareMaps = function(maps){
        if(maps.length === 0){
            return maps;
        }
        
       // Filter out undefined maps
       var definedMaps = maps.filter(function(d){
            return (typeof d !== 'undefined' && d !== null);
       });

       // Filter out deleted maps
       var activeMaps = definedMaps.filter(function (d) {
           return (d.get("datedeleted") === null || d.get("datedeleted") === TIME_ZERO || d.get("datedeleted") === "0000-00-00 00:00:00");
       });
       
       // Filter out maps that are no longer in the map collection
       var mapCol = Hub.get("map");
       var collectionMaps = activeMaps.filter(function(d){
           return (mapCol.has(d.id));
       });

       // Format maps
       var formattedMaps = collectionMaps.map(function (d) {
           // Get resource
           var map = Hub.wrap(mapCol.get(d.id));
           var resources = map.getUserResources();
           return {
               val: Hub.stripHtml(map.get("title")), 
               linkid: map.id, 
               pdf: (resources.length > 0)
           };
       });

       return formattedMaps;
    };

    /**
     * Prepare tags for display
     * @param {NodeModel} circle - the circle with tags to display
     * @return {Object[]} - tags formatted for display
     */
    pvt.prepareTags = function (circle) {
       var thisView = this;
       if (circle.has("tags")) {
           return Hub.stripHtml(circle.get("tags")).split(",").filter(function (d) {
               return d.trim().length > 0;
           }).map(function (d) {
               var matchingNodes = pvt.getNodeIDsWithTag.call(thisView, d);
               return {val: d.replaceAll("_", " ") + " (" + matchingNodes.length + " Nodes)"};
           });
       } else {
           return [];
       }
    };
    
    pvt.getNodeIDsWithTag = function(tag){
        return Hub.get("node").filter(function(d){
            if(d.get("tags") !== null && d.get("tags") !== "null"){
                var tags = Hub.stripHtml(d.get("tags")).split(",");
                for(var i = 0; i < tags.length; i++){
                    if(tag === tags[i]){
                        return true;
                    }
                }
                return false;
            }else{
                return false;
            }
        });
    };
    
    
    return Panel;
});


