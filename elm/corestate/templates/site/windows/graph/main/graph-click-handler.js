/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
/* global pvt */

define(["constants","activeGraph","jsclass!3rdParty/jsclass/","hub-lib"], function(Constants,ActiveGraph,JsClass,Hub){
    var pvt = {
        consts: {
            CONTEXT_MENU: {
                ID: "graph-window-context-menu",
                NAME: Constants.STRINGS.GRAPH,
                SELECT_ALL: "select all"
            }
        }
    };
    
    class GraphClickHandler{
        constructor(){
            
        }
        
        handleClick(e, graph){
            var thisView = this;
            var id = null;
            
            if(e.consumed){
                return;
            }
            
            // Get the graph state
            var graphState = application.graphstate;
                
            //if(testSvgModule){
                var mouseOptions = graph.get("clickoptions");
                // Retask the event
                if(!e.hasOwnProperty('pageX')){
                    e = {
                        pageX: mouseOptions.mouse.x,
                        pageY: mouseOptions.mouse.y
                    };
                }
            //}
            
            //appstate.set("omniSearchOpen", false);

            var contextMenu = application.contextmenu;
            contextMenu
                .create(pvt.consts.CONTEXT_MENU.NAME, "click", this)
                /*.addItemIf("deselect node", function () {
                    appstate.set("activeGraphSelectedCircle", null);
                }, appstate.get("activeGraphSelectedCircle") !== null)*/
                .addItem("center", function () {
                    appstate.set("activeGraphTransform", null, {silent: true});
                    appstate.set("activeGraphTransform", "center");
                }).addItem("minimize", function () {
                    ActiveGraph.minimize(appstate, /*update:*/true);
                }).addItemIf("hide gray nodes", function () {
                    ActiveGraph.hideGray(appstate);
                }, 
                // Condition to add 'hide gray nodes'
                (typeof ActiveGraph.getNodeColor(appstate, ActiveGraph.getNodes(appstate)).find(function(d){
                    return (d.color == "gray");
                }) !== 'undefined')
                ).addItemIf("merge with", function () {
                    var factory = contextMenu.create("merge with", "click", "map-context-menu");
            
                    // Save top handle
                    var topHandle = graphState.handle();
                    
                    // Get the minimized maps
                    var minimized = ActiveGraph.getOtherGraphs(appstate);
                    var nameToStateID = new JsClass.Hash();
                    var gi = 0;
                    
                    //var customMapNames = appstate.get("customMapNames");
                    minimized.map(function(handle){
                        gi++;
                        assert(topHandle != handle);
                        assert(graphState.push(handle));
                        var graphID = graphState.get().graphID;
                        assert(graphState.pop());
                        
                        if($.isNumeric(graphID)){
                            graphID = Hub.stripHtml(Hub.get("map").get(graphID).get("title"));
                        }/*else{
                            if(graphID === "custom"){
                                graphID = customMapNames[handle].name;
                            }
                        }*/
                        nameToStateID.store(gi + ". " + graphID, handle);
                        return gi + ". " + graphID;                          
                    }).forEach(function (m) {
                        factory = factory.addItem(m, function () {
                            var stateID = nameToStateID.fetch(m); 
                            
                            graphState.push(stateID);
                            var mergeWith = graphState.get();
                            graphState.pop();
                            
                            var results = ActiveGraph.getNodeColor(appstate, ActiveGraph.getNodes(appstate));
                            results.filter(function(node){
                                return (node.color != "gray");
                            }).forEach(function(node){
                                mergeWith.setNodeColor(node.node, node.color);
                            });

                            graphState.destroy();
                            graphState.push(stateID);
                            graphState.set(mergeWith);
                            return graphState.apply();
                        });
                    });

                    setTimeout(function () {
                        factory.show(e);
                    }, 200);
                },(ActiveGraph.getOtherGraphs(appstate).length > 0))
                .addItemIf("change color", function(){ pvt.cycleSelectedNodeColor.call(thisView); }, (appstate.get("targettedcircles").length > 1), {circlesOn: true, 
                    circleCallback: function(color){ pvt.setSelectedNodeColor.call(thisView,color); }
                })
                .addItemIf("add to new map", function(){ pvt.addNodesToMap.call(thisView, "gray"); }, (appstate.get("targettedcircles").length > 1), {circlesOn: true, 
                    circleCallback: function(color){ pvt.addNodesToMap.call(thisView,color); }
                })
                .addItem(pvt.consts.CONTEXT_MENU.SELECT_ALL, function(){ 
                    var factory = contextMenu.create(pvt.consts.CONTEXT_MENU.SELECT_ALL, "click", "select-all-context-menu");
                    var visibleNodes = ActiveGraph.getNodeColor(appstate, ActiveGraph.getNodes(appstate));
            
                    // Display options to select red,blue, or gray nodes id there are any present
                    ["gray","blue","red"].forEach(function(color){
                        var atLeast = visibleNodes.find(function(d){
                            return (d.color == color);
                        });
                        
                        if(atLeast){
                            factory = factory.addItem(color + " nodes", function () {
                                pvt.selectAllOfColor.call(thisView, color);
                            });
                        }
                    });
                    
                    setTimeout(function () {
                        factory.show(e);
                    }, 200);
                })
                .addItemIf("release node", function(){
                    pvt.releaseNodes.call(thisView);
                }, (appstate.get("targettedcircles").length == 1))
                .addItemIf("release nodes", function(){
                    pvt.releaseNodes.call(thisView);
                }, (appstate.get("targettedcircles").length > 1))
                .addItemIf("add to minimized", function () {
                    var factory = contextMenu.create("add to minimized", "click", "transfer-context-menu");

                    // Save top handle
                    var topHandle = graphState.handle();

                    // Get the minimized maps
                    var minimized = ActiveGraph.getOtherGraphs(appstate);
                    var nameToStateID = new JsClass.Hash();
                    var gi = 0;

                    //var customMapNames = appstate.get("customMapNames");
                    minimized.map(function(handle){
                        gi++;
                        assert(topHandle != handle);
                        assert(graphState.push(handle));
                        var graphID = graphState.get().graphID;
                        assert(graphState.pop());

                        if($.isNumeric(graphID)){
                            graphID = application.datainterface.get("map").get(graphID).get("title");
                        }
                        
                        nameToStateID.store(gi + ". " + graphID, handle);
                        return gi + ". " + graphID;                        
                    }).forEach(function (m) {
                        factory = factory.addItem(m, function () {
                            var stateID = nameToStateID.fetch(m);
                                graphState.push(stateID);

                                // Set the color and replace the definition
                                var graphDef = graphState.get();
                                graphDef.setNodeColor(id, "gray");
                                assert(graphState.set(graphDef));

                                // Reset and apply changes
                                graphState.pop();
                                graphState.apply();
                        }, {circlesOn: true, 
                            circleCallback: function(color){
                                var stateID = nameToStateID.fetch(m);
                                graphState.push(stateID);

                                // Set the color and replace the definition
                                var graphDef = graphState.get();
                                appstate.get("targettedcircles").forEach(function(nid){
                                    graphDef.setNodeColor(nid, color);
                                });
                                assert(graphState.set(graphDef));

                                // Reset and apply changes
                                graphState.pop();
                                graphState.apply();
                            }
                        });
                    });

                    setTimeout(function () {
                        factory.show(e);
                    }, 200);


                }, ((ActiveGraph.getOtherGraphs(appstate).length) > 0 && (appstate.get("targettedcircles").length > 1)))
                .show(e);
        }
    }
    
    /**
     * Sets the color of the nodes whos IDs are currently in the targettedcircle set
     * @param {string} color - new color of nodes
     */
    pvt.addNodesToMap = function(color){
        var thisView = this;
        var graphState = application.graphstate;
        
        // Get the active graph id to swap in and out
        var topHandle = graphState.handle();

        // Open the target graph
        var newHandle = graphState.create(getMapName(appstate, {
            type: "addmanytonew"
        }));
        graphState.push(newHandle);
        
        var activeNodeIDs = appstate.get("targettedcircles");
        assert(activeNodeIDs.length > 1);
        
        var graphState = application.graphstate;
        var activeGraph = graphState.get();
        activeNodeIDs.forEach(function(n){
            activeGraph.setNodeColor(n.id,color);
        });
        graphState.set(activeGraph);

        // Minimize the new graph
        graphState.pop();

        // Update the state
        graphState.apply();
    };
    
    /**
     * Select all nodes of a particular color. If multiselect is active then 
     * the nodes will be added to the active set. If not then they will simply
     * replace the active set.
     * @param {string} color - the color of the nodes to select
     */
    pvt.selectAllOfColor = function(color){
        var thisView = this;
        var activeNodeIDs = appstate.get("targettedcircles");
        if(application.multiselect === true){
            activeNodeIDs.reset();
        }
        
        // Get the colors of all visible nodes
        var nodeColors = ActiveGraph.getNodeColor(appstate, ActiveGraph.getNodes(appstate));
        var newTagets = nodeColors.filter(function(n){
            return (n.color === color);
        }).map(function(n){
            return {
                id: n.node
            };
        });
        
        activeNodeIDs.add(newTagets);
        //appstate.trigger("change:targettedcircles");
    };
    
    /**
     * Release all targetted/selected nodes
     */
    pvt.releaseNodes = function(){
        var thisView = this;
        appstate.get("targettedcircles").reset();
        appstate.get("selectedcircles").reset(); 
    };
    
    /**
     * Sets the color of the nodes whos IDs are currently in the targettedcircle set
     * @param {string} color - new color of nodes
     */
    pvt.setSelectedNodeColor = function(color){
        var thisView = this;
        
        var activeNodeIDs = appstate.get("targettedcircles");
        assert(activeNodeIDs.length > 1);
        
        var graphState = application.graphstate;
        var activeGraph = graphState.get();
        activeNodeIDs.forEach(function(n){
            activeGraph.setNodeColor(n.id,color);
        });
        graphState.set(activeGraph);
        graphState.apply();
    };
    
    return GraphClickHandler;
});

