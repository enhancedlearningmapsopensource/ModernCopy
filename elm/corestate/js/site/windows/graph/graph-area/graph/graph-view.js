define([//"corestate/js/graphs/renderer/graph-renderer",
        "corestate/js/graphs/node-class"],
function(//GraphRenderer,
         NodeClass){
    
    class GraphView{
        /**
         * Create new graph view
         * @param {string}      options.id - the graph id
         * @param {object}      options.el - the DOM element to augment
         * @param {fabricator}  options.fabricator - the edge fabricator
         * @param {planner}     options.planner - the dagre graph planner
         */
        constructor(options){
            var thisClass = this;
            
            // Validate options
            assertType(options.id, 'string');
            assertDefined(options.el);
            assertDefined(options.fabricator);
            assertDefined(options.planner);
            
            // Set class variables
            thisClass.id            = options.id;
            thisClass.$el           = $(options.el);
            thisClass.renderer      = new GraphRenderer(thisClass.$el, thisClass.id);
            thisClass.fabricator    = options.fabricator;
            thisClass.planner       = options.planner;
            thisClass.graphDefUrl   = null;
            thisClass.edgeDefStr    = null;     // Limit edge fabrication
        }
        
        load(){
            return this.renderer.load();
        }
        
        /**
         * 
         * @param {object} options
         * @param {SubgraphModel=}   options.model      - the server model 
         * @param {GraphState=}      options.state      - the graph state
         * @param {boolean=}         options.forceRender- whether to force the graph to render
         * @param {boolean=}         options.transform  - current graph transform
         * @param {boolean=false}    options.shownodeid - whether to show the node id 
         * @param {bool=false}       options.showindirect - show dashed lines
         * @param {bool=false}       options.showgrid   - show grid
         * @param {NodeCollection}   options.nodecol    - the collection of node data
         * @param {number}           options.selectedcircle - the id of the selected circle
         * @param {number}           options.targetcircle - the id of the targetted circle
         * @param {number}           options.selectededge - the id of the selected edge
         * @returns {Promise<boolean>} - true if successful render, otherwise false
         */
        render(options){
            var thisClass = this;
            
            // Validate options
            options = (!options) ? {} : options;
            options.model = (!options.model) ? null : options.model;
            options.state = (!options.state) ? null : options.state;
            options.forceRender = (typeof options.forceRender === 'undefined' || options.forceRender === null) ? false : options.forceRender;
            options.isActiveGraph = (thisClass.id == "active-graph-view" || thisClass.id == 'graph-print-view');
            options.shownodeid = (typeof options.shownodeid === 'undefined' || options.shownodeid === null) ? false : options.shownodeid;
            options.showindirect = (typeof options.showindirect === 'undefined' || options.showindirect === null) ? false : options.showindirect;
            options.showgrid = (typeof options.showgrid === 'undefined' || options.showgrid === null) ? false : options.showgrid;
            options.selectedcircle = (typeof options.selectedcircle === 'undefined' || options.selectedcircle === null) ? null : options.selectedcircle;
            options.targetcircle = (typeof options.targetcircle === 'undefined' || options.targetcircle === null) ? null : options.targetcircle;
            options.selectededge = (typeof options.selectededge === 'undefined' || options.selectededge === null) ? null : options.selectededge;

            // Enforce transform
            assert(options.hasOwnProperty("transform") && options.transform !== null, "No transform provided");
            assertDefined(options.nodecol);
            
            // Clear the known graph state if force is on
            if(options.forceRender){
                thisClass.graphDefUrl = null;
            }
            
            // Generate the graph's definition url
            var graphDefUrl = thisClass.generateUrl(options);
            assertDefined(graphDefUrl);
            
            // Perform a full render
            if(thisClass.graphDefUrl === null || graphDefUrl != thisClass.graphDefUrl){
                console.log("graph-view("+ thisClass.id+"): found a difference between definition urls. Rendering the new map.")
                console.log("     existing def:" + thisClass.graphDefUrl);
                console.log("     new def:" + graphDefUrl);
                // Update the graph definition url
                thisClass.graphDefUrl = graphDefUrl;
                
                // Verify no edges
                assert(typeof options.edges === 'undefined');
                
                // Format the nodes for rendering
                return thisClass.getNodes(options).then(function(nodes){
                    options.nodes = nodes;
                    return thisClass.getEdges(options);
                })
                
                
                .then(function(edges){
                    // Gather edges
                    options.edges = edges;  
                    
                    // Plan Graph
                    options.layout = thisClass.planner.planGraph(options);
                    
                    // Render the graph
                    return thisClass.renderer.render(options).then(function(response){
                        // Get the url for the current options
                        if(graphDefUrl != thisClass.graphDefUrl){
                            return Promise.resolve({response: false, options: {rerender: true}});
                        }else{
                            return Promise.resolve({response: response, options: options});
                        }
                    });
                });
            }
            
            // Perform a refresh
            else{
                console.log("graph-view("+ thisClass.id+"): found no difference between definition urls. Refreshing the map.")
                console.log("     existing def:" + thisClass.graphDefUrl);
                console.log("     new def:" + graphDefUrl);
                return thisClass.renderer.refresh(options).then(function(response){
                    return Promise.resolve({response: response, options: options});
                });
            }
        }
        
        /**
         * @param {object} options
         * @param {SubgraphModel=}   options.model      - the server model 
         * @param {GraphState=}      options.state      - the graph state
         * @returns {(string|null)} - the graph url if one exists, otherwise null
         */
        generateUrl(options){
            var graphDefUrl = null;
            
            // A state was provided (best option)
            if(options.state){
                return options.state.definition.toUrl();
            }
            
            // A model was provided
            else if(options.model){
                return options.model.id;
            }
            
            // Cannot determine a url
            else{
                return null;
            }
        }
        
        /**
         * Get the edges to display on the current graph given the node string.
         * 
         * @param {object} options
         * @param {bool=false}  options.forceRender - forces a re-render
         * @param {bool=false}  options.showindirect - show dashed lines
         * @param {NodeClass[]} options.nodes - the array containing the node objects
         * @return {Promise<Object[]>} - list of edges that connect the given node set
         */
        getEdges(options) {
            var thisClass = this;
            var edges = [];
            
            // Class variables
            var fabricator = thisClass.fabricator;
            var nodes = options.nodes;
            
            // Validate options and class variables
            [
                nodes,
                fabricator,
            ].forEach(function(k){
                assertDefined(k);
            });

            // There are no nodes so return no edges
            if(options.nodes.length > 0){

                // Separate nodes into gray and colored
                var grayNodes = [];
                var coloredNodes = [];
                options.nodes.forEach(function(d){
                    if(d.color == "gray"){
                        grayNodes.push(d.id);
                    }else{
                        coloredNodes.push(d.id);
                    }
                });
                
                var checkString = coloredNodes.sort().join(",") + "-g-" + grayNodes.sort().join(",");                
                //if (checkString != thisClass.edgeDefStr || options.forceRender) {
                    // Set the edge def to prevent re-fabrication
                    thisClass.edgeDefStr = checkString;
                    
                    // Construct comma separated string
                    var nodeString = nodes.map(function (d) { return d.id; }).sort().join(",");
                    
                    // Fabricate edges
                    var edges = thisClass.fabricator.getStructure(nodeString, options.showindirect);

                    //var edgeString = JSON.stringify(edges);

                    // Process edges
                    for (var i = 0; i < edges.length; i++) {
                        var d = edges[i];

                        // Get the source
                        var source = d.source;
                        for (var s = 0; s < nodes.length; s++) {
                            if (nodes[s].id == source) {
                                source = nodes[s];
                                break;
                            }
                        }

                        // Get the target
                        var target = d.target;
                        for (var t = 0; t < nodes.length; t++) {
                            if (nodes[t].id == target) {
                                target = nodes[t];
                                break;
                            }
                        }

                        var parentChildOk = false;
                        if (source.child === null && target.parent === null) {
                            parentChildOk = true;
                        } else {
                            if (source.child !== null && target.parent !== null) {
                                if (source.child === target.id && target.parent == source.id) {
                                    parentChildOk = true;
                                }
                            } else if (source.child !== null && source.child == target.id) {
                                parentChildOk = true;
                            } else if (target.parent !== null && target.parent == source.id) {
                                parentChildOk = true;
                            }
                        }

                        if (parentChildOk) {
                            d.id = d.source + "-" + d.target + (d.hasOwnProperty("conceals") ? "-d" : "");
                        } else {
                            edges.splice(i, 1);
                            i--;
                        }
                    } // end for
                //} // end if
            } // end if 

            return Promise.resolve(edges);
        } // end method
        
        /**
         * @param {object} options
         * @param {SubgraphModel}   options.model      - the server model 
         * @param {GraphState}      options.state      - the graph state
         * @param {boolean}         options.shownodeid - whether to show the node id 
         * @param {NodeCollection}  options.nodecol    - the collection of node data
         * @returns {Promise<NodeClass[]>} - the graph url if one exists, otherwise null
         */
        getNodes(options) {
            var thisView = this;
            
            // Validate options
            [
                "model",
                "state",
                "shownodeid",
                "nodecol"
            ].forEach(function(k){
                assertDefined(options[k]);
            });
            
            
            var graphDefinition = options.state.definition;
            var subgraph = options.model;

            // Node defined by:
            // a) id
            // b) text
            // c) color
            // d) offset
            // e) parent (for parent-only nodes)
            // f) child (for child-only nodes)

            // Get the nodes to show
            var nodes = new JsClass.Hash();
            var alienNodes = []; 

            if (subgraph) {
                var colors = Object.keys(subgraph.get("nodes"));
                colors.forEach(function(color){
                    subgraph.get("nodes")[color].forEach(function(nodeModel){
                        // Get the decorated title. If there isn't a viable decorated title then grab the raw title
                        var text = nodeModel.has("decoratedTitle") ? nodeModel.get("decoratedTitle") : nodeModel.get("title");

                        // Add the node id if necessary
                        if(options.shownodeid){
                            text = nodeModel.get("textid") + " " + text;
                        }

                        // Create the new object and add it
                        var nodeOb = new NodeClass(nodeModel.id, color, text, 0, 0);    // id, color, text, x, y
                        nodes.store(nodeOb.id, nodeOb);
                    });
                });
            }
            
            // Remove nodes
            graphDefinition.removed.forEach(function (r) {
                if(nodes.hasKey(r)){
                    nodes.remove(r);
                }
            });

            // Get additional nodes that should be shown
            graphDefinition.additional.forEach(function (a) {
                var color = a.color;
                a.nodes.forEach(function (nid) {
                    if(nodes.hasKey(nid)){
                        nodes.remove(nid);
                    }
                    nodes.store(nid, new NodeClass(nid, color, "unknown", 0, 0));
                    alienNodes.push(nid);
                });
            });

            // Add parent-only nodes
            graphDefinition.parentOnly.forEach(function (r) {
                r.nodes.forEach(function (n) {
                    if(nodes.hasKey(n)){
                        nodes.remove(n);
                    }

                    var newNode = new NodeClass(n, "gray", "unknown", 0, 0);
                    newNode.parent = Number(r.parent);
                    nodes.store(newNode.id, newNode);
                    alienNodes.push(newNode.id);
                });
            });

            // Add child-only nodes
            graphDefinition.childOnly.forEach(function (r) {
                r.nodes.forEach(function (n) {
                    if(nodes.hasKey(n)){
                        nodes.remove(n);
                    }

                    var newNode = new NodeClass(n, "gray", "unknown", 0, 0);
                    newNode.child = Number(r.child);
                    nodes.store(newNode.id, newNode);
                    alienNodes.push(newNode.id);
                });
            });

            // Organize alien nodes
            removeDuplicates(alienNodes);

            // Get alien models
            var alienModels = alienNodes.map(function(d){
                return options.nodecol.get(d);
            });
            
            // Fix text
            alienModels.forEach(function(model){
                // Get the decorated title. If there isn't a viable decorated title then grab the raw title
                var text = model.has("decoratedTitle") ? model.get("decoratedTitle") : model.get("title");
                if(options.shownodeid){
                    text = model.get("textid") + " " + text;
                }
                nodes.fetch(model.id).text = text;
            });
            
            // Return nodes
            return Promise.resolve(nodes.map(function(nodeItem){
                return nodeItem.value;
            }));
        }
    }
    
    return GraphView;
});