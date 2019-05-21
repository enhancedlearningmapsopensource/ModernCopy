define(["corestate/js/graphs/json-parser", "jsclass!3rdParty/jsclass/"], function (JsonParser, JsClass) {
    /**
     * 
     * @type GraphDefinition
     */
    class GraphDefinition {
        constructor(graphID) {
            var thisClass = this;
            /**
             * @type {(string|number)}
             */
            thisClass.graphID = graphID;
            
            Object.defineProperty(thisClass, "arr", {
                /**
                 * @returns {Object[]} 
                 */
                get: function () {
                    return this.nodes.map(function(d){
                        return d.value;
                    });
                }
            });
            
            Object.defineProperty(thisClass, "removed", {
                get: function () {
                    var thisClass = this;
                    return thisClass.arr.filter(function(d){
                        return (d.state == "removed");
                    }).map(function(d){
                        return d.id;
                    })
                }
            });
            
            Object.defineProperty(thisClass, "additional", {
                get: function(){
                    var additional = thisClass.arr.filter(function(d){
                        return (d.state != "removed" && d.state != "ponly" && d.state != "chonly");
                    });

                    var additionalColors = additional.map(function(d){
                        return d.state;
                    });
                    additionalColors.sort(function(a,b){
                        return a.localeCompare(b);
                    });
                    removeDuplicates(additionalColors);
                    return additionalColors.map(function(d){
                        return {
                            color: d,
                            nodes: additional.filter(function(c){
                                return (c.state == d);
                            }).map(function(c){
                                return c.id;
                            })
                        };
                    });
                }
            });
            
            Object.defineProperty(thisClass, "childOnly", {
                get: function(){
                    // Get childOnly nodes
                    var childOnly = thisClass.arr.filter(function(d){
                        return (d.state == "chonly");
                    });

                    // Get target nodes
                    var childOnlyTargets = childOnly.map(function(d){
                        return d.c;
                    });
                    removeDuplicates(childOnlyTargets);

                    // Get pointers for each target
                    return childOnlyTargets.map(function(d){
                        return {
                            child: d,
                            nodes: childOnly.filter(function(c){
                                return (c.c == d);
                            }).map(function(c){return c.id;})
                        };
                    });
                }
            });
            
            Object.defineProperty(thisClass, "parentOnly", {
                get: function(){
                    // Get parentOnly nodes
                    var parentOnly = thisClass.arr.filter(function(d){
                        return (d.state == "ponly");
                    });

                    // Get target nodes
                    var parentOnlyTargets = parentOnly.map(function(d){
                        return d.p;
                    });
                    removeDuplicates(parentOnlyTargets);

                    // Get pointers for each target
                    return parentOnlyTargets.map(function(d){
                        return {
                            parent: d,
                            nodes: parentOnly.filter(function(c){
                                return (c.p == d);
                            }).map(function(c){return c.id;})
                        };
                    });
                }
            });
            
            
            thisClass.nodes = new JsClass.Hash();
            thisClass.parser = new JsonParser();
            
            assertDefined(thisClass.graphID);
        }

        /** 
         * Add a node that is connected to the given child and nothing else
         * @param nodeID - the id of the node
         * @param childID - the id of the child to connect to
         */
        addChildOnlyNode(nodeID, childID) {
            assertType(nodeID, 'number');
            assertType(childID, 'number');
            
            var thisClass = this;
            var nodes = thisClass.nodes;
            
            if(nodes.hasKey(nodeID)){
                var n = nodes.fetch(nodeID);
                n.state = "chonly";
                n.c = childID;
            }else{
                nodes.store(nodeID, {
                    id: nodeID,
                    state: "chonly",
                    p: null,
                    c: childID
                });
            };
        }

        /** 
         * Add a node that is connected to the given parent and nothing else
         * @param nodeID - the id of the node
         * @param parentID - the id of the parent to connect to
         */
        addParentOnlyNode(nodeID, parentID) {
            assertType(nodeID, 'number');
            assertType(parentID, 'number');
            
            var thisClass = this;
            var nodes = thisClass.nodes;
            
            if(nodes.hasKey(nodeID)){
                var n = nodes.fetch(nodeID);
                n.state = "ponly";
                n.p = parentID;
            }else{
                nodes.store(nodeID, {
                    id: nodeID,
                    state: "ponly",
                    p: parentID,
                    c: null
                });
            };
        }
        
        /**
         * Create a shallow copy
         * @returns {GraphDefinition}
         */
        copy(){
            var thisClass = this;
            var copy = new GraphDefinition(thisClass.graphID);
            copy.fromJson(JSON.parse(JSON.stringify(thisClass.toJson())));
            return copy;
        }

        /**
         * @param {number} nodeID
         * @param {string} color
         */
        setNodeColor(nodeID, color) {
            assertType(nodeID, "number");
            
            if(typeof color === 'number'){
                switch(color){
                    case 0: color = "gray"; break;
                    case 1: color = "red"; break;    
                    case 2: color = "blue"; break;
                    case 3: color = "green"; break;
                    case 4: color = "orange"; break;
                    default: throw Error("unknown color: " + color);
                }
            }
            
            var thisClass = this;
            var nodes = thisClass.nodes;
            
            if(nodes.hasKey(nodeID)){
                var n = nodes.fetch(nodeID);
                n.state = color;
                n.c = null;
                n.p = null;
            }else{
                nodes.store(nodeID, {
                    id: nodeID,
                    state: color,
                    p: null,
                    c: null
                });
            }
        }
        
        fromNewJson(json){
            var thisClass = this;
                
            var graphCompressor = appstate.get("graphcompressor");
            var lzString = appstate.get("lzstring");

            var jsonStr = JSON.stringify(json);
            var url = lzString.compressToEncodedURIComponent(jsonStr);
            var decompressed = {};

            graphCompressor.decompress(
                url,
                decompressed
            );

            var attributes = Object.keys(decompressed.attributeValues);
            var nodes = decompressed.nodes.map(function(d){
                var node = d;
                attributes.forEach(function(attr){
                    node[attr] = decompressed.attributeValues[attr][node[attr]];
                    thisClass.setNodeColor(Number(node.nodeid), 1);
                });
                return node;
            });

            thisClass.newGraph = {
                attr: decompressed.attributeValues,
                nodes: nodes,
                url: url
            };
        }

        fromJson(json) {
            var thisClass = this;
            if (json.hasOwnProperty("version")) {
                return thisClass.fromNewJson(json);
            }
            
            if (json.hasOwnProperty("a")) {
                json.a.forEach(function (additionalColor) {
                    /*thisClass.additional.push(
                            {
                                color: additionalColor.c, 
                                nodes: additionalColor.i.map(function (d) {
                                    return Number(d);
                                })
                            }
                    );*/
                    var color = additionalColor.c;
                    var nodes = additionalColor.i;
                    nodes.forEach(function(d){
                        thisClass.setNodeColor(Number(d), color);
                    });
                    
                });
            }
            if (json.hasOwnProperty("r")) {
                json.r.forEach(function (removeID) {
                    thisClass.nodes.forEach(function(d){
                        thisClass.removeNode(Number(removeID));
                    });
                });
            }
            if (json.hasOwnProperty("c")) {
                json.c.forEach(function (childOnly) {
                    var id = Number(childOnly.c);
                    childOnly.i.map(function(d){
                        thisClass.addChildOnlyNode(Number(d), id);
                    });
                });
            }
            if (json.hasOwnProperty("p")) {
                json.p.forEach(function (parentOnly) {
                    var id = Number(parentOnly.p);
                    parentOnly.i.map(function(d){
                        thisClass.addParentOnlyNode(Number(d), id);
                    });
                });
            }
        }
        
        /**
         * Get the nodes present in the definition
         * @note if the server model is provided the list of nodes will be far more comprehensive
         * @param {SubgraphModel=} serverModel - the graph server model if one exists
         * @returns {number[]} - list of node ids
         */
        getNodeIDs(serverModel){
            var thisClass = this;
            
            // Structure to hold final result
            var nodes = [];

            if (serverModel) {
                // Get the nodes shown by the subgraph by default
                var colors = Object.keys(serverModel.get("nodes"));
                colors.forEach(function(color){
                    serverModel.get("nodes")[color].forEach(function(nodeModel){
                        nodes.push(nodeModel.id);
                    });
                });
            }

            // Remove nodes
            for (var removalIndex = 0; removalIndex < thisClass.removed.length; removalIndex++) {
                var idToRemove = thisClass.removed[removalIndex];
                for (var nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
                    var nodeID = nodes[nodeIndex];
                    if (idToRemove == nodeID) {
                        nodes.splice(nodeIndex, 1);
                        nodeIndex--;
                    }
                }
            }

            // Add additional nodes
            thisClass.additional.forEach(function (colorSet) {
                colorSet.nodes.forEach(function (nodeID) {
                    nodes.push(nodeID);
                });
            });

            // Add child-only nodes
            thisClass.childOnly.forEach(function (childOnlyItem) {
                childOnlyItem.nodes.forEach(function (nodeID) {
                    nodes.push(nodeID);
                });
            });

            // Add parent-only nodes
            thisClass.parentOnly.forEach(function (parentOnlyItem) {
                parentOnlyItem.nodes.forEach(function (nodeID) {
                    nodes.push(nodeID);
                });
            });

            // Sort and remove duplicates
            nodes.sort();
            for (var i = 0; i < nodes.length - 1; i++) {
                if (nodes[i] == nodes[i + 1]) {
                    nodes.splice(i, 1);
                    i--;
                }
            }
            
            return nodes;
        }

        /**
         * Hide gray nodes
         */
        hideGrayNodes(serverModel) {
            var thisClass = this;

            // Find gray nodes in the subgraph
            if (serverModel) {
                if (serverModel.has("nodes") && serverModel.get("nodes").hasOwnProperty("gray")) {
                    var grayNodeIDs = serverModel.get("nodes").gray.map(function (d) {
                        return d.id;
                    });
                    thisClass.removed = thisClass.removed.concat(grayNodeIDs);
                    removeDuplicates(thisClass.removed);
                }
            }

            // Hide nodes in the gray color set
            for (var colorIndex = 0; colorIndex < thisClass.additional.length; colorIndex++) {
                var additionalColor = thisClass.additional[colorIndex];
                if (additionalColor.color == "gray") {
                    // Add all nodes in here to 'removed' in case the node is includeded in the original set
                    for (var nodeIndex = 0; nodeIndex < additionalColor.nodes.length; nodeIndex++) {
                        var coloredNodeID = additionalColor.nodes[nodeIndex];
                        thisClass.removed.push(coloredNodeID);
                    }

                    thisClass.additional.splice(colorIndex, 1);
                }
            }

            // Hide child only nodes
            thisClass.childOnly = [];

            // Hide parent only nodes
            thisClass.parentOnly = [];
        }
        
        importServerModel(serverModel){
            var colorNodes = serverModel.getNodes();
            throw Error();
        }
        
        removeNode(id){
            var thisClass = this;
            assertType(id, 'number');
            if(thisClass.nodes.hasKey(id)){
                thisClass.nodes.remove(id);
            }
            // If it has not been removed then add it to the 'removed' set
        }

        /**
         * Checks to see if there are changes made to the graph that are not included in the server model
         * @return Promise(bool) - true if it is dirty, otherwise false  
         */
        isDirty() {
            throw Error("deprecated 11/3/2017 - Use GraphManager.isDirty() instead.")
            var thisClass = this;

            // If there are any elements in the arrays then return true
            return Promise.resolve([thisClass.additional, thisClass.childOnly, thisClass.parentOnly, thisClass.removed].reduce(function (acc, val) {
                return acc || (val.length > 0);
            }, false));
        }
        
        isNewGraph() {
            return this.hasOwnProperty("newGraph");
        }

        toJson() {
            var thisClass = this;
            
            var def = {};
            var graphDefinition = thisClass;

            if (graphDefinition.graphID === null) {
                def = {};
            } else {
                def.g = graphDefinition.graphID;
                
                // Get removed nodes
                var removed = thisClass.nodes.filter(function(d){
                    return (d.state == "removed");
                });
                
                if (removed > 0) {
                    def.r = removed.map(function (d) {
                        return d.id;
                    });
                }
                
                var childOnly = thisClass.childOnly;
                
                if (childOnly.length > 0) {
                    def.c = childOnly.map(function (d) {
                        return {
                            c: d.child, i: d.nodes.map(function (e) {
                                return e;
                            })
                        };
                    });
                }
                
                
                var parentOnly = thisClass.parentOnly;
                
                if (parentOnly.length > 0) {
                    def.p = parentOnly.map(function (d) {
                        return {
                            p: d.parent, i: d.nodes.map(function (e) {
                                return e;
                            })
                        }
                    });
                }
                
                var additional = thisClass.additional;
                if (additional.length > 0) {
                    def.a = additional.map(function (d) {
                        return {
                            c: d.color, i: d.nodes.map(function (e) {
                                return e;
                            })
                        }
                    });
                }
            }
            return def;
        }

        toUrl() {
            var thisClass = this;
            if(!thisClass.isNewGraph()){
                return thisClass.parser.stringify(thisClass.toJson());
            }else{
                return thisClass.newGraph.url;
            }
        }
    }

    return GraphDefinition;
});