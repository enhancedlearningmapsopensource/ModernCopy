/**
 * Module representing a graph manager
 * @module svg/manager
 */
define('svg-lib/manager', ["jquery","jsclass!3rdParty/jsclass/","./graph", "./canvas", "./handlers/handler-set"],
function($, 
         JsClass, 
         SvgGraph,
         SvgCanvas,
         HandlerSet){
    var pvt = {
        consts:{
            MAX_GRAPHS: 0,  // Max number that can be kept in storage
            MAX_NODES: 0,  
        }
    };

    /**
     * @constructor
     * @alias module:svg/manager
     */
    class GraphManager{
        /**
         * 
         * @param {number} id - manager id
         * @param {jQuery} $el - jquery element to bing graph to
         * @param {Object} options 
         * @param {EdgeFabricator} options.fabricator - edge fabricator
         * @param {GraphPlanner} options.planner - graph planner
         * @param {TextManager} options.textManager - text manager
         * @param {Object} options.options - binding options
         * @param {Object[]}} options.options.handlers - handlers for events
         * @param {function[]}} options.options.handlers.click - handlers for click events
         * @param {(number, SvgNode)=>void} options.options.handlers.click.node - handler for node clicks
         * @param {(number, SvgEdge)=>void} options.options.handlers.click.edge - handler for edge clicks
         * @param {(number, SvgIcon)=>void} options.options.handlers.click.icon - handler for icon clicks
         * @param {(any*)=>SvgNode} options.options.overrides - constructors used to override object
         * @param {(any*)=>SvgNode} options.options.overrides.node - node override object
         * @memberof GraphManager
         */
        constructor(id, $el, options){
            assertType(id, 'number');
            
            
            
            
            var thisClass = this;
            thisClass.id = id;

            // Variables
            thisClass._$el = null;
            thisClass._data = {
                graphs: {
                    active: null,
                    stored: [],
                },
                nodes: []
            };
            
            thisClass._utility = {
                fabricator: options.fabricator,
                planner: options.planner,
                text: options.textManager
            };

            if($el !== null){
                thisClass.bind($el, options.options);
            }
        }

        /**
         * Bind the manager to the given dom element
         * @param {$(elem)} $el - a jquery dom element
         * @param {Object} options - binding options
         * @param {Object[]}} options.handlers - handlers for events
         * @param {function[]}} options.handlers.click - handlers for click events
         * @param {(number, SvgNode)=>void} options.handlers.click.node - handler for node clicks
         * @param {(number, SvgEdge)=>void} options.handlers.click.edge - handler for edge clicks
         * @param {(number, SvgIcon)=>void} options.handlers.click.icon - handler for icon clicks
         * @param {(any*)=>SvgNode} options.overrides - constructors used to override object
         * @param {(any*)=>SvgNode} options.overrides.node - node override object
         */
        bind($el, options){
            if(!($el instanceof $)){
                console.warn("should have provided a jquery element");
                $el = $(el);
            }

            var thisClass = this;
            thisClass._$el = $el;            

            // Clear the element
            pvt.clearEl.call(thisClass);
            thisClass._viewport = $(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
            thisClass._$el[0].appendChild(thisClass._viewport[0]);
            thisClass._handlers = new HandlerSet(options.handlers);
            thisClass._canvas = new SvgCanvas(thisClass.id, thisClass._viewport, { handlers: thisClass._handlers, overrides:options.overrides });
            thisClass._overrides = options.overrides;

            /*thisClass.resizeSensor = new ResizeSensor(thisClass._$el, function() {
                console.log('Changed to ' + thisClass._$el[0].clientWidth);
            });*/
        }

        /**
         * Removes references to the dom element and then removes the element from the tree. To leave 
         * the element where it is (such as creating an icon), use release()
         */
        destroy(){
            var thisClass = this;

            // Clear the element
            pvt.clearEl.call(thisClass);

            // Destroy the element
            thisClass._$el.unbind();
            thisClass._$el.remove();

            // Release any reference to the element
            thisClass.release();
        }

        draw(){
            var thisClass = this;

            if(thisClass._data.graphs.active.draw()){
                function completeDraw(){
                    // Remove graph attributes to allow measurement
                    thisClass._viewport[0].removeAttribute("width");
                    thisClass._viewport[0].removeAttribute("height");
                    thisClass._viewport[0].removeAttribute("viewBox");
                    thisClass._viewport[0].removeAttribute("preserveAspectRatio");
                    
                    // Dagre laid out the objects with the nodes laid out relative to a center
                    // point. Unfortunately the edges occasionally extend outside the bounds and
                    // so we need to account for them.                     
                    var nodeBounds = thisClass._data.graphs.active.bounds("node");
                    var edgeBounds = thisClass._data.graphs.active.bounds("edge");
                    
                    // nodeBounds === null when there are no nodes
                    if(nodeBounds !== null){
                        var viewport = {
                            min: {
                                x: 0,
                                y: 0,
                            },
                            width: nodeBounds.width,
                            height: nodeBounds.height
                        };

                        // If edges extend outside the bounds of the nodes then we need to shift the min & max of the viewport
                        if(edgeBounds !== null && edgeBounds.width > nodeBounds.width){  
                            if(edgeBounds.xmin < nodeBounds.xmin){
                                var deltaLeft = nodeBounds.xmin - edgeBounds.xmin;
                                viewport.min.x -= deltaLeft;
                                viewport.width += deltaLeft;
                            }

                            if(edgeBounds.xmax > nodeBounds.xmax){
                                viewport.width += edgeBounds.xmax - nodeBounds.xmax;
                            }
                        }
                        
                        if(viewport.height > 0 && viewport.width > 0){
                            // Account for the 5px buffer on each edge
                            viewport.height += 10;
                            viewport.width += 10;

                            // Set graph properties
                            thisClass._viewport[0].setAttribute("width", "100%");
                            thisClass._viewport[0].setAttribute("height", "100%");
                            thisClass._viewport[0].setAttribute("viewBox", viewport.min.x.toString()+" "+viewport.min.y.toString()+" "+viewport.width.toString()+" "+viewport.height.toString());
                            thisClass._viewport[0].setAttribute("preserveAspectRatio","xMidYMid meet");
                            return true;
                        }
                    }
                    return false;
                }
                
                // Try to draw three times then give up
                if(!completeDraw()){
                    setTimeout(function(){
                        if(!completeDraw()){
                            setTimeout(completeDraw,1000);
                        }
                    }, 100);
                }
            }
            return thisClass;
        }

        /**
         * Draw a given graph
         * 
         * @param {object}      graphDefinition 
         * @param {int}         graphDefinition.id - the id of the graph
         * @param {object}      graphDefinition.transform - transform
         * @param {NodeOb[]}    graphDefinition.nodes - the list of nodes to draw
         * @param {boolean}     graphDefinition.animate - indicates whether the next render should be animated
         * @param {boolean}     graphDefinition.indirect - indicates whether indirect edges are allowed
         * @borrows module:svg/graph#setNodes
         */
        prepare(graphDefinition){
            var thisClass = this;

            // Validate graph
            if(typeof graphDefinition === 'undefined' || graphDefinition === null){ throw Error("no graph definition provided");}
            else if(!graphDefinition.hasOwnProperty("id")){ throw Error("no graph id provided"); }
            else if(!graphDefinition.hasOwnProperty("nodes")){ throw Error("no nodes provided"); }

            var graph = null;
            if(!thisClass._data.graphs.active && thisClass._data.graphs.stored.length == 0){
                var graphOptions = {
                    planner: thisClass._utility.planner,
                    text: thisClass._utility.text,
                    handlers: thisClass._handlers,
                    overrides: thisClass._overrides
                }
                
                graph = new SvgGraph(graphDefinition.id, graphOptions);
                pvt.setGraphActive.call(thisClass, graph);
            }else if(thisClass._data.graphs.active){
                // The id of the active graph matches the new id so just keep using the active graph
                if(thisClass._data.graphs.active.id == graphDefinition.id){
                    graph = thisClass._data.graphs.active;
                }
                
                // The active graph id does not match so we need to swap out the graph
                else{
                    pvt.moveActiveGraphToStorage.call(thisClass);

                    // Do we have this graph in storage?
                    var graph = thisClass._data.graphs.stored.reduce(function(acc, d, i){
                        return (d.id == graphDefinition.id) ? {index: i, graph: d} : acc;
                    }, null);

                    // We already have the stored graph in storage
                    if(graph){
                        // Remove from storage
                        thisClass._data.graphs.stored.splice(graph.index);
                        graph = graph.graph;
                    }
                    
                    // We do NOT have a matching graph in storage
                    else{
                        // Do we need a new graph?
                        // We have already stored the max number so we need to retask one
                        if(thisClass._data.graphs.stored.length > 0 && thisClass._data.graphs.stored.length >= pvt.consts.MAX_GRAPHS){
                            // Get the first graph in the list (the first one in)
                            graph = thisClass._data.graphs.stored.shift();
                            
                            // Retask it to the current id
                            graph.retask(graphDefinition.id);
                        }
                        // We still have room in storage so lets not remove one we may need soon. Create one instead
                        else{
                            throw Error("See other 'new SvgGraph' call");
                            graph = new SvgGraph(graphDefinition.id, thisClass._planner);
                        }
                    }

                    // Set as active
                    pvt.setGraphActive.call(thisClass, graph);
                }
            }

            if(graph === null){
                throw Error("could not recover a graph");
            }
            
            // Set animation
            graphDefinition.animate = (typeof graphDefinition.animate === 'undefined') ? false : graphDefinition.animate;
            graph.set("animate", graphDefinition.animate);
            
            // Set indirect
            graphDefinition.indirect = (typeof graphDefinition.indirect === 'undefined') ? true : graphDefinition.indirect;
            graph.set("indirect", graphDefinition.indirect);

            // Set graph transform
            var transform = {x: 0, y: 0, scale: 1};
            ["x","y","scale"].forEach(function(t){
                // Override transform using current values
                transform[t] = (!graph.has("transform" + t)) ? transform[t] : graph.get("transform"+t);

                // Override transform using graph definition (highest priority)
                transform[t] = (!graphDefinition.transform || typeof graphDefinition.transform[t] === 'undefined') ? transform[t] : graphDefinition.transform[t];
                thisClass._data.graphs.active.set("transform" + t, transform[t]);
            });
            
            // Merge any graph classes
            if(graphDefinition.hasOwnProperty("class")){
                //var graphClass = (thisClass._data.graphs.active.has("class")) ? thisClass._data.graphs.active.get("class") : [];
                
                // Merge new classes
                var graphClass = /*graphClass.concat(*/graphDefinition.class/*)*/;
                
                // Remove duplicates
                graphClass.sort(function(a, b){
                    return a.localeCompare(b);
                });
                for(var i = 0; i < graphClass.length - 1; i++){
                    if(graphClass[i] == graphClass[i+1]){
                        graphClass.splice(i,1);
                        i--;
                    }
                }
                
                // Set the class
                thisClass._data.graphs.active.set("class", graphClass);
            }
            
            // Get the node ids
            var nodeIDs = graphDefinition.nodes.map(function(d){
                return d.id;
            });
            
            // Get the current nodes
            var currentNodeIDs = graph.get("nodes").map(function(d){
                return d.value.id;
            });
            
            // If the intersection of the current and new nodes is the same size as the other two sets then no change
            var hasChanged = (nodeIDs.length !== currentNodeIDs.length || (new JsClass.Set(nodeIDs).intersection(new JsClass.Set(currentNodeIDs))).length !== nodeIDs.length);
            hasChanged = hasChanged || (graph._changed.hasOwnProperty("indirect"));
            
            // Determine the edges
            // Very expensive. Don't run unless necessary
            /** @type {EdgeDef[]} edges */
            
            // Changes were detected in the nodes
            if(hasChanged){
                // Fabricator was found
                if(thisClass._utility.fabricator !== null){
                    
                    // Find nodes with children
                    var enforcedEdges = [];
                    var isolatedNodes = [];
                    
                    // Find nodes with children
                    graphDefinition.nodes.filter(function(d){
                        return (d.hasOwnProperty("children"));
                    }).forEach(function(d){
                        d.children.forEach(function(c){
                            enforcedEdges.push({
                                id: assertType(Number([d.id,c,c.toString().length,1].join("")), 'number'),
                                src: d.id,
                                tgt: c,
                                dir: true
                            });
                            isolatedNodes.push(c);
                        });
                    });
                    // Find nodes with parents
                    graphDefinition.nodes.filter(function(d){
                        return (d.hasOwnProperty("parents"));
                    }).forEach(function(d){
                        d.parents.forEach(function(c){
                            enforcedEdges.push({
                                id: assertType(Number([c,d.id,d.id.toString().length,1].join("")), 'number'),
                                src: c,
                                tgt: d.id,
                                dir: true
                            });
                            isolatedNodes.push(c);
                        });
                    });
                    isolatedNodes = new JsClass.Set(isolatedNodes);
                    
                    // Remove isolated nodes 
                    nodeIDs = nodeIDs.filter(function(d){
                        return (!isolatedNodes.contains(d));
                    });
                    
                    // Determine edges for non-enforced nodes
                    var edges = thisClass._utility.fabricator.getEdges(nodeIDs.join(), graph.get("indirect"));
                    edges.forEach(function(d){
                        var src = d.src.toString();
                        var tgt = d.tgt.toString();
                        var tgtLength = tgt.length.toString();
                        var direct = d.dir ? "1" : "0";
                        d.id = assertType(Number([src,tgt,tgtLength,direct].join("")), 'number');
                    });
                    
                    // Add the enforced edges back in
                    edges = edges.concat(enforcedEdges);
                    
                    var nodeIDSet = new JsClass.Set(nodeIDs.concat(isolatedNodes.toArray()));
                    edges.forEach(function(e){
                        assert(nodeIDSet.contains(e.src));
                        assert(nodeIDSet.contains(e.tgt));
                    });
                    
                    var edgesPreSet = edges.map(function(d){return d.id;}).join(",");

                    // Set the edges
                    graph.setEdges(edges);
                    
                    var edgesPostSet = graph.get("edges").map(function(d){return d.value.id;}).join(",");
                    
                    graph.get("edges").forEach(function(e){
                        assert(nodeIDSet.contains(e.value.get("src")));
                        assert(nodeIDSet.contains(e.value.get("tgt")));
                    });
                }
                
                // No fabricator found
                else{
                    console.warn("no fabricator detected. ignoring edge render.");
                }
            }
            
            // Get the node id set
            var nodeIDSet = new JsClass.Set(graphDefinition.nodes.map(function(d){
                return d.id;
            }));
            
            // Determine whether nodes have children/parents
            graphDefinition.nodes.forEach(function(node){
                if(node.id == 1830){
                    var k = 0;
                }
                
                node.hasChildren = (thisClass._utility.fabricator.edgeGraph.getChildrenOf(node.id).filter(function(child){
                    // Keep (return true) if the child is not in the set
                    return !nodeIDSet.contains(child);
                }).length > 0);
                node.hasParents = (thisClass._utility.fabricator.edgeGraph.getParentsOf(node.id).filter(function(parent){
                    // Keep (return true) if the parent is not in the set
                    return !nodeIDSet.contains(parent);
                }).length > 0);
            })
            
            // Set the node font
            graph.set("nodefont", graphDefinition.nodefont ? graphDefinition.nodefont : null);
            
            // Set the min node font size
            graph.set("minnodefontsize", graphDefinition.minnodefontsize ? graphDefinition.minnodefontsize : null);
            
            // Set the nodes for the graph second to render ahead of the edges
            graph.setNodes(graphDefinition.nodes);
            
            return thisClass;
        }

        

        /**
         * Checks to see if the manager is unused so it can be reused
         * @return {}
         */
        isUnused(){
            var thisClass = this;
            return (thisClass._$el === null);
        }

        /**
         * Removes references to the dom element but does not destroy the element. To destroy the element
         * use destroy()
         */
        release(){
            var thisClass = this;
            thisClass._$el = null;
        }
    }

    

    /**
     * Clear the element attached to this manager
     */
    pvt.clearEl = function(){
        var thisClass = this;

        function clearChild($el){
            $el.children().each(function(d){
                clearChild($(this));
            });
            $el.unbind();
            $el.remove();
        }

        // Clear the element
        thisClass._$el.children().each(function(d){
            clearChild($(this));
        });

        var confirm = thisClass._$el.html().trim();
        if(confirm.length > 0){
            throw Error("failed to clear the element");
        }
    }

    pvt.moveActiveGraphToStorage = function(){
        var thisClass = this;
        
        thisClass._data.graphs.stored.push(thisClass._data.graphs.active);
        thisClass._viewport[0].removeChild(thisClass._data.graphs.active.elem()[0]);
        thisClass._data.graphs.active = null;
    }

    pvt.setGraphActive = function(graph){
        var thisClass = this;
        
        if(thisClass._data.graphs.active){
            throw Error("There is already a graph active. Remove it first using 'pvt.moveActiveGraphToStorage()'");
        }

        thisClass._viewport[0].appendChild(graph.elem()[0]);
        thisClass._canvas.set("graph", graph);
        thisClass._data.graphs.active = graph;
    }

    return GraphManager;
});