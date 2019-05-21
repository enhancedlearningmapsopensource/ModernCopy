define(["backbone",
        "mustache",
        "activeGraph",
        "hub-lib",
        "text!./bottom-panel-node-template.html",
        "./bp-edge-view",
        "jsclass!3rdParty/jsclass/"],
        function (Backbone,
                Mustache,
                ActiveGraph,
                Hub,
                Template,
                BottomPanelEdgeView,
                JsClass) {

            var pvt = {
                consts: {
                    DOM_MUSTACHE: "#bottom-panel-template",
                    DOM_MUSTACHE_EDGE: "#bottom-panel-edge-template",
                    DOM_TITLE: ".content-container > #bot-header #bot-header-col",
                    DOM_DESCRIPTION: ".content-container > #bot-content > .col-xs-12 > #description > .col-xs-12",
                    DOM_CONTENT: ".content-container > #bot-content",
                    NODE_ID: "bot-node-",
                    EDGE_ID: "bot-edge-"
                }
            };

            var BottomPanelView = Backbone.View.extend({
                template: Template,
                events: {
                    "click .bot-standard": "delegateClickStandard",
                    "click .bot-map": "delegateClickMap",
                    "click .bot-parent": "delegateClickNode",
                    "click .bot-child": "delegateClickNode",
                    "click .bot-edge": "delegateClickNode",
                    "click .c-icon": "delegateColorCircleChanged",
                    "click .bottom-c-icon": "delegateColorCircleChanged",
                    "click #bot-close-col": "delegateClosePanel",
                    "click .bot-more": "delegateShowMore",
                    "click .bot-tag": "delegateSearchTags"
                },

                delegateClosePanel: function (e) {
                    var thisView = this;
                    thisView.model.set("activeGraphSelectedCircle", null);
                    thisView.model.set("activeGraphSelectedEdge", null);
                },

                delegateColorCircleChanged: function (e) {
                    e.preventDefault();
                    var thisView = this;
                    var id = $(e.currentTarget).attr("id");
                    id = id.split("-");

                    var nodeID = Number(id[1]);
                    var color = id[0];
                    if (color == "SbluM") {
                        color = "blue";
                    } else if (color == "SredM") {
                        color = "red";
                    } else if (color == "SgreM") {
                        color = "gray";
                    }

                    var graphManager = application.graphstate;
                    var graphDef = graphManager.get();
                    graphDef.setNodeColor(nodeID, color);
                    graphManager.set(graphDef);
                    return graphManager.apply().then(function () {
                        return thisView.render();
                    });

                    /*thisView.model.get("graphState").closeGraph();
                     thisView.model.get("graphState").getGraphFromID(thisView.model.get("graphState").activeGraph).setNodeColor(nodeID, color);
                     thisView.model.get("graphState").updateProgramState().then(function(){
                     thisView.render();
                     })
                     .catch(function(err){
                     throw Error(err);
                     })*/
                    //thisView.model.get("graphs").get("activeGraph").setNodeColor(nodeID, color)
                },

                delegateClickNode: function (e) {
                    e.preventDefault();
                    var thisView = this;
                    var id = Number($(e.currentTarget).attr("id").split(pvt.consts.NODE_ID)[1]);
                    id = (isNaN(id)) ? Number($(e.currentTarget).attr("id").split(pvt.consts.EDGE_ID)[1]) : id;
                    thisView.model.set("activeGraphSelectedCircle", id);
                },

                /**
                 * @listens click:.bot-standard
                 */
                delegateClickStandard: function (e) {
                    application.views.sidePanelStandards.delegateClickStandard(e);
                    /*return;
                     
                     e.preventDefault();
                     var thisView = this;
                     var id = $(e.currentTarget).html().trim();
                     
                     thisView.model.get("subgraphSearch").create(thisView.model.get("activeSubject"))
                     .addTerm(id)
                     .searchOne()
                     .then(function(results){
                     ActiveGraph.set(thisView.model, results.id, {close: true});
                     });*/
                },

                /**
                 * @listens click:.bot-map
                 */
                delegateClickMap: function (e) {
                    e.preventDefault();
                    var thisView = this;
                    var id = $(e.currentTarget).attr("id");
                    id = Number(id.split("bot-node-")[1]);
                    ActiveGraph.loadGraph(thisView.model, id, {close: true});
                },

                delegateSearchTags: function (e) {
                    var thisView = this;
                    e.preventDefault();

                    var $el = $(e.currentTarget);
                    var tag = $el.html();
                    tag = tag.split("(")[0].trim().replaceAll(" ", "_");

                    // Open new map
                    //ActiveGraph.set(thisView.model, null, {close: true, update: false}).then(function(){
                    var matches = pvt.getNodeIDsWithTag.call(thisView, tag);

                    // Add nodes to map
                    var nodeColor = "red";
                    var graphManager = thisView.model.get("graphState");
                    //var activeGraph = graphManager.getGraphFromID(graphManager.activeGraph);
                    var dynamicMap = {
                        name: "_tag" + tag.toLowerCase(),
                        nodes: matches
                    };
                    return ActiveGraph.loadGraph(thisView.model, dynamicMap, {update: true, close: true});
                    //});
                },

                delegateShowMore: function (e) {
                    var thisView = this;
                    e.preventDefault();
                    var $el = $(e.currentTarget);
                    var classList = $el.parent("td")[0].getAttribute("class");

                    thisView.$el.find(".bot-more").each(function (e) {
                        $(this).parent("td").show();
                    });
                    $el.parent("td").hide();

                    thisView.$el.find(".extra").each(function (e) {
                        $(this).hide();
                    });
                    thisView.$el.find(".extra." + classList).each(function (e) {
                        $(this).show();
                    });
                    return false;
                },

                initialize: function () {
                    var thisView = this;
                    Backbone.View.prototype.initialize.apply(thisView);
                    Mustache.parse(thisView.template);

                    /*{
                        var template = thisView.$el.find(pvt.consts.DOM_MUSTACHE).html();
                        Mustache.parse(template);
                        thisView.model.get("mustache").bottomPanel = template;
                    }*/
                    
                    thisView.model = new Backbone.Model({
                        id: 'bottompanelnodemodel',
                        edgeview: new BottomPanelEdgeView({
                            id: 'bottom-panel-edge-view'
                        })
                    });
                    thisView.model.get("edgeview").render();
                    

                    //thisView.$el = $(thisView.el);
                    thisView.listenTo(appstate, "change:activeGraphSelectedCircle", thisView.render);
                    thisView.listenTo(appstate, "change:activeGraphSelectedEdge", thisView.render);
                    thisView.listenTo(appstate, "change:sideBarOpen", thisView.render);
                    thisView.listenTo(appstate, "change:sidePanel", thisView.render);
                    thisView.listenTo(appstate, "change:activeGraph", thisView.render);
                    thisView.listenTo(application.datainterface.get("user"), "change", thisView.render);

                    //var activeGraph = thisView.model.get("graphs").get("activeGraph");
                    //thisView.listenTo(activeGraph, "change:definition", thisView.render);
                    //thisView.listenTo(thisView.model.get("graphs").get("graphs"), "change", thisView.render);
                },

                isReady: function () {
                    return true;
                },

                render: function () {
                    var thisView = this;
                    
                    // Get the program state
                    var programState = appstate;

                    // If there is no active graph (the user closed it for whatever reason) then close the bottom panel
                    if (programState.get("activeGraph") == null) {
                        programState.set("activeGraphSelectedCircle", null);
                        programState.set("selectededge", null);
                    }

                    var circleSelected  = programState.get("activeGraphSelectedCircle");
                    var edgeSelected    = programState.get("selectededge");

                    if (circleSelected === null && edgeSelected === null) {
                        thisView.$el.removeClass("open");
                    } else {
                        thisView.$el.addClass("open");

                        // Adjust for the side bar
                        var sideBarOpen = programState.get("sideBarOpen");
                        if (sideBarOpen) {
                            thisView.$el.addClass("side-bar-open");
                        } else {
                            thisView.$el.removeClass("side-bar-open");
                        }

                        // Adjust for the side panel
                        var sidePanel = programState.get("sidePanel");
                        if (sidePanel !== null) {
                            thisView.$el.addClass("side-panel-open");
                        } else {
                            thisView.$el.removeClass("side-panel-open");
                        }

                        if (circleSelected !== null) {
                            pvt.renderCircle.call(thisView, circleSelected);
                        } else if (edgeSelected !== null) {
                            thisView.model.get("views").bottomPanelEdge.render();
                        }
                    }
                }

            });
            
            
            pvt.fetchNodeServerModel = function (nodeID) {
                var thisView = this;
                return thisView.model.get("managers").get("node", [nodeID]);
            };
            
            /**
             * Get the node description formatted for visible output
             * @param {NodeModel} currNode - the current node
             * @return {string}
             */
            pvt.getNodeDescription = function(currNode){
                return stripItags(currNode.get("short"));
            };

            /**
             * Get all node ids with the given tag
             * @param {string} tag
             * @returns {number[]} - id of nodes with tag
             */
            pvt.getNodeIDsWithTag = function (tag) {
                var thisView = this;

                assertType(tag, 'string');
                
                // Get the program state
                var programState = appstate;

                var regExpr = new RegExp(".*" + tag + ".*", 'i');
                return assertType(application.datainterface.get("node").filter(function (d) {
                    return regExpr.test(d.get("tags"));
                }).map(function (d) {
                    return d.id;
                }), 'number[]');
            };

            /**
             * Get the node title formatted for visible output
             * @param {NodeModel} currNode - the current node
             * @param {boolean} showTextID - turn the textid on/off
             * @return {string}
             */
            pvt.getNodeTitle = function(currNode, showTextID){
                // Add text id if necessary (otherwise leave blank)
                var textID = (showTextID) ? currNode.get("textid") + " " : "";
                
                // Get title
                var title = currNode.get("title");
                
                // Compile
                var compiledTitle = textID + title;
                
                // Clean
                var cleanTitle = stripItags(compiledTitle);
                return cleanTitle;
            };
            
            /**
             * Prepare list of map models for display in the panel
             * @param {MapModel[]} maps - the map models
             * @return {Object[]} - formatted maps
             */
            pvt.prepareMaps = function(maps){
            	// Filter out undefined maps
            	var definedMaps = maps.filter(function(d){
            		return (typeof d !== 'undefined' && d !== null);
            	});
            
            	// Filter out deleted maps
                var activeMaps = definedMaps.filter(function (d) {
                    return (d.get("datedeleted") === null);
                });

                // Format maps
                var formattedMaps = activeMaps.map(function (d) {
                    // Get resource
                    var map = Hub.wrap(Hub.get("map").get(d.id));
                    var resources = map.getUserResources();
                    return {val: map.get("title"), linkid: map.id, pdf: (resources.length > 0)};
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
                    return circle.get("tags").split(",").filter(function (d) {
                        return d.trim().length > 0;
                    }).map(function (d) {
                        var matchingNodes = pvt.getNodeIDsWithTag.call(thisView, d);
                        return {val: d.replaceAll("_", " ") + " (" + matchingNodes.length + " Nodes)"};
                    });
                } else {
                    return [];
                }
            };

            pvt.removeVisible = function (list, visible) {
                for (var i = 0; i < list.length; i++) {
                    if (visible.contains(list[i])) {
                        list.splice(i, 1);
                        i--;
                    }
                }
            };

            /**
             * Render the selected circle in the bottom panel
             * @param {number} circleSelected - the circle
             * @return {Promise} 
             */
            pvt.renderCircle = function (circleSelected) {
                var thisView = this;
                var parents = null,
                        children = null,
                        maps = null,
                        standards = null;

                var standardsReady = [];
                var mapsReady = [];
                var currNode = null;

                var relatives = [
                    {
                        nm: "parents",
                        ids: null,
                        nodes: []
                    },
                    {
                        nm: "children",
                        ids: null,
                        nodes: []
                    }
                ];

                
                var programState = appstate;
                var dataInterface = application.datainterface;
                
                /*var user = thisView.model.get('user');
                var preferences = dataInterface.getWhere("preference", {name: "Show NodeID", isdisabled: 0});
                
                assert(preferences.length == 1, "too many matches");
                var prefID = preferences[0].id;
                var showNodeID = (user.getPreference(dataInterface.get("preference"), prefID)  == "t");*/
                
                var pref = getPreference("NODEID_ON");
                if(pref === null){
                    throw Error("Cannot find preference: NODEID_ON");
                }
                var showNodeID = (pref.localeCompare("t") === 0);
                
                var nodes = dataInterface.getModels("node", [circleSelected]);
                var currNode = nodes[0];

                parents = currNode.getParentIDs(dataInterface).map(function (d) {
                    return d;
                });
                children = currNode.getChildrenIDs(dataInterface).map(function (d) {
                    return d;
                });
                maps = currNode.getMaps().map(function (d) {
                    return d;
                });
                standards = currNode.getSIDs().map(function (d) {
                    return d;
                });

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
                    parents = (new JsClass.Set(parents)).difference(visible).toArray();
                    children = (new JsClass.Set(children)).difference(visible).toArray();



                    var isCurrVisible = (nodeIDs.filter(function (d) {
                        return d == currNode.id;
                    }) > 0);


                    var activeSubject = thisView.model.get("activeSubject");

                    var managers = thisView.model.get("managers");

                    return Promise.all([
                        dataInterface.getModels("standard", standards.map(function (d) {
                            return (typeof d === 'number') ? d : d.id;
                        })),
                        dataInterface.getModels("map", maps.map(function (d) {
                            return (typeof d === 'number') ? d : d.id;
                        }), {subject: activeSubject}),
                        dataInterface.getModels("node", parents),
                        dataInterface.getModels("node", children),
                        isCurrVisible
                    ]);
                }).then(function (results) {

                    standards           = results[0];
                    maps                = results[1];
                    parents             = results[2];
                    children            = results[3];
                    var isCurrVisible   = results[4];
                    
                    
                    
                    var nodeTitle = pvt.getNodeTitle(currNode, showNodeID);
                    //(((showNodeID) ? currNode.get("textid") + " " : "") + currNode.get("title")).replaceAll("[i]", "<em>").replaceAll("[/i]", "</em>");
                    var nodeDescription = pvt.getNodeDescription(currNode);//, showNodeID)
                            
                    //currNode.get("shorttitle").replaceAll("[i]", "<em>").replaceAll("[/i]", "</em>");
                    thisView.$el.find(pvt.consts.DOM_TITLE).html(nodeTitle);

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
                        return {val: d.getTextID(dataInterface)};
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
                    pvt.prepareMaps(maps);

                    //Set up maps section 
                    frame.sections.push({
                        name: "Map Views",
                        sectionwidth: 3,
                        firstvalue: maps.shift(),
                        linkclass: "bot-map",
                        sectionlist: maps
                    });

					
                    // Prepare tags for display
                    var tags = pvt.prepareTags.call(thisView, currNode);
                    
                    // Set up tags section
                    frame.sections.push({
                        name: "Tags",
                        sectionwidth: 3,
                        firstvalue: tags.shift(),
                        linkclass: "bot-tag",
                        sectionlist: tags
                    });


                    /**
                     * Set up the right frame
                     */
                    frame = {id: "right", sections: [], smalllist: false};
                    table.frames.push(frame);

                    /**
                     * Set up hidden parents 
                     */
                    //var parentNodes = relatives[0].nodes;

                    // Format parent & children output
                    parents = parents.map(function (d) {
                        return {
                            val: (((showNodeID) ? d.get("textid") + " " : "") + d.get("title")).replaceAll("[i]", "<em>").replaceAll("[/i]", "</em>"),
                            linkid: d.id
                        }
                    });
                    children = children.map(function (d) {
                        return {
                            val: (((showNodeID) ? d.get("textid") + " " : "") + d.get("title")).replaceAll("[i]", "<em>").replaceAll("[/i]", "</em>"),
                            linkid: d.id
                        };
                    });


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
                    
                    

                    //var template = thisView.model.get("mustache").bottomPanel;
                    thisView.$el.find(pvt.consts.DOM_CONTENT).html(Mustache.render(thisView.template, table));

                });
            };
            

            return BottomPanelView;
        });