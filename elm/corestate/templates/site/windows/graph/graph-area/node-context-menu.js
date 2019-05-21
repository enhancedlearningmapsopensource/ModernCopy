/* global application */

define([
    "constants",
    "activeGraph",
    "jsclass!3rdParty/jsclass/",
    "hub-lib"
], 
function(
    Constants,
    ActiveGraph,
    JsClass,
    Hub
){
    var pvt = {
        consts:{
            CONTEXT_MENU_EDGE: Constants.STRINGS.EDGE,
            CONTEXT_MENU_ADD: "add to " + Constants.STRINGS.GRAPH,
            CONTEXT_MENU_ADD_NEW: "add to new " + Constants.STRINGS.GRAPH,
            CONTEXT_MENU_TEMPLATE_SEL: "#context-menu-template",
            CONTEXT_MENU_CHANGE_COLOR: Constants.STRINGS.CHANGE_COLOR,
            CONTEXT_MENU_SELECT: Constants.STRINGS.SELECT_NODE            
        }
    };
    
    /**
     * Show the node context menu
     * @param {number} id - the id of the node to show the context menu for
     * @param {node} node - the node to show the context menu for
     */
    var show = function(owner, id, node){
        var thisView = owner;
        
        // Get the context menu
        var contextMenu = application.contextmenu;
        
        // Get the graph state
        var graphState = application.graphstate;
        
        // Get the node's element
        var $el = node.elem();
        
        contextMenu
            .create(Constants.STRINGS.CIRCLE, "click", "circle-"+id)
            .addItem(Constants.STRINGS.CHANGE_COLOR, function () {
                var activeGraphStateID = graphState.activeGraph;
                var activeGraph = graphState.get();
                var color = $el.find("circle").attr("stroke");
                switch (color) {
                    case "gray":
                        color = "red";
                        break;
                    case "red":
                        color = "blue";
                        break;
                    case "blue":
                        color = "gray";
                        break;
                    case "green":
                        color = "green";
                        break;
                    case "orange":
                        color = "orange";
                        break;
                    default:
                        throw Error("Unknown color: " + color);
                }
                activeGraph.setNodeColor(id, color);
                graphState.set(activeGraph);
                graphState.apply();
            },{circlesOn: true, 
                circleCallback: function(color){
                    var activeGraph = graphState.get();
                    activeGraph.setNodeColor(id, color);
                    graphState.set(activeGraph);
                    graphState.apply();
            }})
            /**
             * Triggered when the user clicks the 'Select' option in the context menu
             */
            .addItem(Constants.STRINGS.SELECT_NODE, function () {
                appstate.get("selectedcircles").reset();
                appstate.get("selectedcircles").add({
                    id: id
                });
                appstate.set({ selectededge: null });
            })
            .addItemIf("add to minimized", function () {
                var factory = contextMenu.create(pvt.consts.CONTEXT_MENU_ADD, "click", "node-context-menu");

                // Save top handle
                var topHandle = graphState.handle();

                // Get the minimized maps
                var minimized = ActiveGraph.getOtherGraphs(thisView.model);
                var nameToStateID = new JsClass.Hash();
                var gi = 0;

                //var customMapNames = thisView.model.get("customMapNames");
                minimized.map(function(handle){
                    gi++;
                    assert(topHandle !== handle);
                    assert(graphState.push(handle));
                    var graphID = graphState.get().graphID;
                    assert(graphState.pop());

                    if($.isNumeric(graphID)){
                        graphID = Hub.stripHtml(Hub.get("map").get(graphID).get("title"));
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
                            graphDef.setNodeColor(id, color);
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


            }, (ActiveGraph.getOtherGraphs(appstate).length > 0))
            .addItem(pvt.consts.CONTEXT_MENU_ADD_NEW, function () {
                pvt.addToNewMap.call(thisView, id, Constants.COLOR.GREY);
            }, {circlesOn: true, 
                circleCallback: function(color){
                    pvt.addToNewMap.call(thisView, id, color);
                }})
            .show(e);
    };
    
    pvt.addToNewMap = function(id, color){
        var thisView = this;
        var graphState = application.graphstate;
        
        // Get the active graph id to swap in and out
        var topHandle = graphState.handle();

        // Open the target graph
        var graphName = getMapName(appstate, {
            type: "addtonew",
            nodeid: id
        });
        var newHandle = graphState.create(graphName);
        graphState.push(newHandle);

        // Add the node
        var graphDef = graphState.get();
        graphDef.setNodeColor(id, color);
        graphState.set(graphDef);

        // Minimize the new graph
        graphState.pop();

        // Update the state
        graphState.apply();
    };
    
    return show;
});


