define(["corestate/js/graphs/graph-definition",
        "corestate/js/graphs/json-parser"], 
function (GraphDefinition,
          JsonParser) {
    class GraphState {
        constructor(id, graphID) {
            var thisClass = this;
            thisClass.id = id;
            thisClass.handle = id;
            thisClass.parser = new JsonParser();
            thisClass.clear();
            thisClass.definition = new GraphDefinition(graphID);
        }

        /** 
         * Add a node that is connected to the given child and nothing else
         * @param nodeID - the id of the node
         * @param childID - the id of the child to connect to
         */
        addChildOnlyNode(nodeID, childID) {
            var thisClass = this;
            thisClass.definition.addChildOnlyNode(nodeID, childID);
        }

        /** 
         * Add a node that is connected to the given parent and nothing else
         * @param nodeID - the id of the node
         * @param parentID - the id of the parent to connect to
         */
        addParentOnlyNode(nodeID, parentID) {
            var thisClass = this;
            thisClass.definition.addParentOnlyNode(nodeID, parentID);
        }

        /**
         * Clear the graph state
         */
        clear() {
            var thisClass = this;
            thisClass.definition = null;
        }



        fromJson(json) {
            var thisClass = this;
            if (thisClass.definition === null) {
                thisClass.definition = new GraphDefinition();
            }
            return thisClass.definition.fromJson(json);
        }

        getServerModel(){
            var thisClass = this;
            var graphID = this.definition.graphID;
            var managers = appstate.get("managers");


            if (graphID == null) {
                throw Error("Invalid graphID:" + graphID);
            }

            if($.isNumeric(graphID)){
                return managers.get("subgraph", graphID).then(function(matchingSubgraphs){
                    return Promise.resolve((matchingSubgraphs.length == 1) ? matchingSubgraphs[0] : null);
                });
            }else{
                var subgraphManager = managers.managers.fetch("subgraph");
                var matchingSubgraph = subgraphManager.findWhere({title: graphID});
                if(!matchingSubgraph){
                    matchingSubgraph = null;
                }
                return Promise.resolve(matchingSubgraph);
            }
        }
        

        /**
         * Hide gray nodes
         */
        hideGrayNodes() {
            var thisClass = this;
            return thisClass.getServerModel().then(function(serverModel){
                thisClass.definition.hideGrayNodes(serverModel);
                return Promise.resolve();
            });
        }

        
        /**
         * Checks to see if there are changes made to the graph that are not included in the server model
         * @return Promise(bool) - true if it is dirty, otherwise false  
         */
        isDirty(){
            throw Error("deprecated 11/3/2017 - Use GraphManager.isDirty() instead.")
            return this.definition.isDirty();
        }
        
        isNewGraph(){
            return this.definition.isNewGraph();
        }

        /**
         * Set the graphID of the graph definition
         * @param {string} graphID - the graph id
         * @param {SubgraphModel=} serverModel - the graph server model if one exists
         */
        setGraphID(graphID, serverModel) {
            var thisClass = this;
            var definition = thisClass.definition;    
            
            // No definition exists. Create one.
            if (definition === null) {
                thisClass.definition = new GraphDefinition();
            }
            
            // Definition exists so check for node errors
            else{
                // The server model was provided so use it to detect node errors
                if(serverModel){
                    var numDefinedNodes = definition.getNodeIDs();
                    var numTotalNodes = definition.getNodeIDs(serverModel);
                    
                    // There is inconsistent behavior because server model does not register nodes
                    if(numDefinedNodes != numTotalNodes){
                        // Get the server model's nodes
                        var serverModelNodes = serverModel.getNodes();
                        
                        // Set the color for each node as if it were 'additional'
                        serverModelNodes.forEach(function(colorNode){
                            if(typeof colorNode.node === 'number'){
                                thisClass.setNodeColor(colorNode.node, colorNode.color);
                            }else{
                                thisClass.setNodeColor(colorNode.node.id, colorNode.color);
                            }
                        });
                    }
                }
            }
            
            // Set the graph id
            thisClass.definition.graphID = graphID;
        }

        /**
         * Set a node's color
         * @param {number} nodeID - the id of the node to set
         * @param {string} color - the color of the node
         * @returns {undefined}
         */
        setNodeColor(nodeID, color) {
            var thisClass = this;
            
            assertType(nodeID, 'number');
            assertType(color, 'string');
            
            if (thisClass.definition === null) {
                thisClass.definition = new GraphDefinition();
            }
            return assertType(thisClass.definition.setNodeColor(nodeID, color), 'undefined');
        }

        toJson() {
            var thisClass = this;
            var json = thisClass.definition.toJson();
            return json;
        }

        toUrl() {
            var thisClass = this;
            return thisClass.parser.stringify(thisClass.toJson());
        }

    }

    return GraphState;
});
