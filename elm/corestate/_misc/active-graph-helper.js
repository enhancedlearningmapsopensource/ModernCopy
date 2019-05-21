/* global application */

/**
 * Helper wrapper for working with the active graph
 */
define([/*"jsclass!3rdParty/jsclass/",*/ "hub-lib"],
    function (/*JsClass,*/ Hub) {
        var activeGraph = {};
        var pvt = {};

        activeGraph.close = function (programState) {

        };

        /**
                     * Get the graphID of the active graph
                     * @param {ProgramState} programState - the program state
                     * @return {string} - the graphID of the active graph
                     */
        activeGraph.getGraphID = function (programState) {
            var thisHelper = this;
            programState = appstate;
                        
            var graphState = application.graphstate;
            return (!graphState.isEmpty()) ? graphState.get().graphID : null;
        };


        /**
                     * Get the server model of the active graph
                     * @param {ProgramState} programState - the program state
                     * @return {ServerModel|null} - the server model of the active graph (if one exists)
                     */
        activeGraph.getGraphServerModel = function () {
            var thisHelper = this;

            var graphManager = application.graphstate;
            if (!graphManager.isEmpty()) {
                //var activeGraphState = pvt.getActiveGraphState(appstate);
                var graphDef = graphManager.get();
                if($.isNumeric(graphDef.graphID)){
                    return Hub.get("map").get(graphDef.graphID);
                }else{
                    return null;
                }

                // Construct the search
                /*var search = application.subgraphsearch
                                    .create(programState.get("activeSet"), programState.get("activeSubject"))
                                    .addTerm(graphDef.graphID)
                                    .searchOne();

                            return search;*/
            } else {
                throw Error("no graph found");
            }
        };
                    
        /**
                     * @alias activeGraph/getGraphServerModel
                     */
        activeGraph.getServerModel = function () {
            return this.getGraphServerModel(appstate);
        };

        /**
                     * 
                     * @param {Object} programState
                     */
        activeGraph.hideGray = function (programState) {
            var thisHelper = this;
            programState = appstate;
                        
            var graphManager = application.graphstate;
            var graphDef = graphManager.get();
            var targettedNodes = programState.get("targettedcircles");
            var grayNodes = graphDef.arr.filter(function(d){
                return (d.state == "chonly" || d.state == "ponly" || d.state == "gray");
            }).map(function(d){
                return d.id;
            });  
                             
            grayNodes.forEach(function(d){
                // Update the graph state 
                graphDef.removeNode(d);
                            
                // Update the targetted nodes
                targettedNodes.remove(d);
            });
            graphManager.set(graphDef);
            return graphManager.apply({activeGraphTransform: "center"});
        };


                    
                    
        /**
                     * Gets the hidden children of the node with the given id
                     * @param {ProgramState} programState - the program state
                     * @param {int} nodeID - the id of the node
                     * @return {Promise(hiddenChildren)} - the hidden children of the node
                     */
        activeGraph.getHiddenChildren = function (programState, nodeID) {
            var thisHelper = this;    
            programState = appstate;
                        
            return thisHelper.getHiddenRelatives(programState, nodeID, "children");
        };

        /**
                     * Gets the hidden parents of the node with the given id
                     * @param {ProgramState} programState - the program state
                     * @param {int} nodeID - the id of the node
                     * @return {Promise(hiddenParents)} - the hidden parents of the node
                     */
        activeGraph.getHiddenParents = function (programState, nodeID) {
            var thisHelper = this;
            programState = appstate;
                        
            return thisHelper.getHiddenRelatives(programState, nodeID, "parents");
        };


        /**
                     * Gets the hidden relatives of the node with the given id
                     * @param {ProgramState} programState - the program state
                     * @param {int} nodeID - the id of the node
                     * @param {string} relation - either 'children' to get children or 'parents' to get parents
                     * @return {number[]} - the hidden children of the node
                     */
        activeGraph.getHiddenRelatives = function (programState, nodeID, relation) {
            var thisHelper = this;
                        
            var nodeCollection = Hub.get("node");

            var visibleNodeIDs = thisHelper.getNodes(programState);
            //var edgeFabricator = programState.get("edgeFabricator");
            var node = nodeCollection.get(nodeID);

            var relatives = null;
            if (relation === "children") {
                relatives = Hub.wrap(node).childrenIDs();
            } else if (relation === "parents") {
                relatives = Hub.wrap(node).parentIDs();
            } else {
                throw Error("Unknown relation: " + relation);
            }

            for (var c = 0; c < relatives.length; c++) {
                for (var v = 0; v < visibleNodeIDs.length; v++) {
                    if (relatives[c] === visibleNodeIDs[v]) {
                        relatives.splice(c, 1);
                        c--;
                        break;
                    }
                }
            }

            return assertType(relatives, "number[]");
        };

        /**
                     * Gets the color of the node with the given id
                     * @param {ProgramState} programState - the program state
                     * @param {number[]} nodeIDs - the ids of the nodes to find
                     * @return {Object[]} - the color & id of each node
                     */
        activeGraph.getNodeColor = function (programState, nodeIDs) {
            var thisHelper = this;
            programState = appstate;
                        
            assertType(nodeIDs, "number[]");
                        
            var graphManager = application.graphstate;
            var graphDef = graphManager.get();
                        
            return nodeIDs.map(function(d){
                var node = graphDef.nodes.fetch(d);
                return {
                    node: d,
                    color: (node.state != "ponly" && node.state != "chonly") ? node.state : "gray"
                };
            });
        };

        /**
                     * Gets the node ids of all nodes currently visible on the active graph
                     * @param {ProgramState} programState - the program state
                     * @return array - an array of node ids representing all nodes currently visible on the active graph
                     */
        activeGraph.getNodes = function (programState) {
            var thisHelper = this;
            programState = appstate;
                        
            var graphManager = application.graphstate;
            if(!graphManager.isEmpty()){
                var graphDef = graphManager.get();
                var nodeIDs = graphDef.nodes.keys();
                return assertType(nodeIDs, "number[]");
            }else{
                return [];
            }
        };


        activeGraph.getOtherGraphs = function (programState) {
            var thisClass = this;
            programState = appstate;

            // Get the minimized graph states
            var topHandle = null;
            var graphManager = application.graphstate;
            if (!graphManager.isEmpty()) {
                topHandle = graphManager.handle();
                while (!graphManager.isEmpty()) {
                    graphManager.pop();
                }
            }

            // Get states
            graphManager.pushAll();
            var minimizedHandles = [];
            while (!graphManager.isEmpty()) {
                if (graphManager.handle() != topHandle) {
                    minimizedHandles.push(graphManager.handle());
                }
                graphManager.pop();
            }

            // Restore
            if (topHandle != null) {
                graphManager.push(topHandle);
            }
            return minimizedHandles;
        };

        activeGraph.getRenderer = function (programState) {
            programState = appstate;
            return programState.get("graphRenderers").fetch("active-graph-view");
        };


        /**
                     * @typedef {object} DynamicGraph
                     * @property {number[]} nodes
                     * @property {string} name
                     * 
                     * Loads the given graph from an identifier. Similar to set but loads nodes to the graph too
                     * @param {(number|DynamicGraph)} graph - either a number (representing the subgraph's id) or a DynamicGraph object
                     */
        activeGraph.loadGraph = function(programState, graph, options){
            var thisHelper = this;
                        
            // Override the program state
            programState = appstate;
                        
            // Prevent update
            var update = (typeof options.update === "undefined" || options.update === null) ? true : options.update;
            options.update = false;
                        
            if($.isNumeric(graph)){
                graph = Number(graph);
                            
                // Load the graph
                thisHelper.set(programState, graph, options);
                            
                // Get the subgraph
                var serverModel = Hub.get("map").get(graph);
                var graphDef = application.graphstate.get();
                            
                var mapid = serverModel.id;
                Hub.get("mapnode").where({mapid: mapid}).forEach(function(r){
                    graphDef.setNodeColor(r.get("nodeid"), r.get("color"));
                });
                            
                /*serverModel.getNodeColorMap().forEach(function(d){
                                graphDef.setNodeColor(d.id, d.color);
                            });*/
                application.graphstate.set(graphDef);
            }else{
                // Validate the graph's nodes
                graph.nodes.forEach(function(node){
                    assertDefined(node);
                });
                            
                assertType(graph, "object");
                assert(graph.hasOwnProperty("nodes"));
                assert(graph.hasOwnProperty("name"));
                            
                // Load the graph
                thisHelper.set(programState, "_" + graph.name, options);
                            
                // Add the nodes
                var graphDef = application.graphstate.get();
                graph.nodes.forEach(function(d){
                    graphDef.setNodeColor(d, "red");
                });
                application.graphstate.set(graphDef);
            }
                            
            if(update){
                application.graphstate.apply();
            }
        };

        /**
                     * 
                     * @param {type} programState
                     * @param {boolean} update - true => update
                     * @return {undefined}
                     */
        activeGraph.minimize = function (programState, update) {
            // Override the program state
            programState = appstate;
                        
            var graphManager = application.graphstate;
            assert(!graphManager.isEmpty());
            graphManager.pop();
            if (update) {
                graphManager.apply();
            }
        };

        /**
                     * Checks to see if the active graph is synced to the server
                     * 
                     * @param {ProgramState} programState - the program state
                     * @return {Promise} - false if the active graph is synced, otherwise true
                     */
        activeGraph.isDirty = function (programState) {
            throw Error("deprecated. Use isClean instead.");
                        
            // Override the program state
            programState = appstate;
            var graphManager = application.graphstate;
            return (graphManager.isEmpty()) ? Promise.resolve(false) : graphManager.isDirty();
        };

        /**
                     * Checks to see if the active graph is synced to the server
                     * @return {bool} - true if the active graph is synced, otherwise false
                     */
        activeGraph.isClean = function () {
            var graphManager = application.graphstate;
            return !graphManager.isDirty();
        };


        /**
                     * Set the active graph and update the program state.
                     * 
                     * @param {ProgramState} programState - the program state
                     * @param {string|number|null} graphID - the graph id or null to open an empty graph
                     * @param {Object} options - options for the action
                     * @param {bool} options.close - (default: false) if true the currently active graph is closed. If false then the graph is simply minimized.
                     * @param {bool} options.update - (default: true) if true the program state is updated.
                     * @param {bool} options.force - (default: false) if true the active graph is forced to re-render.
                     * @return {Promise} - completion
                     */
        activeGraph.setActiveGraph = function (programState, graphID, options) {
            // Override the program state
            programState = appstate;
            if (!programState) {
                throw Error("no program state provided");
            }

            // Validate the options
            options = (!options) ? {} : options;
            options.close = (typeof options.close === "undefined" || options.close === null) ? true : options.close;
            options.update = (typeof options.update === "undefined" || options.update === null) ? true : options.update;

            // Get the graph manager
            var graphState = application.graphstate;

            // The graph id is identical to the one already open so ignore the change
            if (graphID === activeGraph.getGraphID(programState)) {
                return Promise.resolve();
            } else {

                if (!graphState.isEmpty()) {
                    // Decide how to handle the open graph 
                    // CLose the current graph
                    if (options.close) {
                        assert(graphState.destroy());
                        //graphState.closeGraph();
                    }

                    // Minimize the current graph
                    else {
                        assert(graphState.pop());
                        //graphState.minimizeActiveGraph();
                    }
                }

                // Set the graphID of the currently active graph
                graphState.push(graphState.create(graphID));

                // Update the program state if necessary
                return (options.update) ? graphState.apply() : Promise.resolve();
            }
        };

        // Alias for setActiveGraph
        activeGraph.set = function (programState, graphID, options) {
            // Override the program state
            programState = appstate;
            if (!programState) {
                throw Error("no program state provided");
            }
            return this.setActiveGraph(programState, graphID, options);
        };

        /**
                     * Get the state of the activeGraph object in the graph manager
                     * @param {ProgramState} programState - the program state
                     * @return {GraphState} - the GraphState associated with the active graph
                     */
        pvt.getActiveGraphState = function (programState) {
            // Override the program state
            var graphState = application.graphstate;
            /*var activeGraphStateID = graphState.activeGraph;
                         if (activeGraphStateID === null) {
                         return null;
                         }*/
            return graphState.handle();//getGraphFromID(activeGraphStateID);
        };

        return activeGraph;
    });
