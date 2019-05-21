/**
 * Integer
 * @typedef {number} int
 * 
 * @typedef {Object} NodeOb
 * @property {int} id - node id
 * @property {string} text - the text of the node
 * @property {string} radius - the radius of the node
 * @property {string} color - the fill color of the node
 * @property {object} stroke - the node edge
 * @property {string} stroke.color - the color of the edge
 * @property {int} stroke.width - the width of the edge
 * @property {object=null} transform - the node transform
 * @property {number=0} transform.x - the node x coord
 * @property {number=0} transform.y - the node y coord
 * @property {number=1} transform.scale - the node scale
 * @property {string[]} class - classes to be applied to the node
 */


/**
 * Module representing a graph
 * @module svg/graph
 * 
 */
define('svg-lib/graph', ["jquery","jsclass!3rdParty/jsclass/", "./elem", "./node", "./edge"],
function($, JsClass, SvgElement, SvgNode, SvgEdge){

    var pvt = {};

    /**
     * @extends SvgElement
     */
    class SvgGraph extends SvgElement{
        /**
         * Creates an instance of SvgGraph.
         * @param {int} id - the graphid
         * @param {Object} options
         * @param {GraphPlanner} options.planner - planner for graph layout
         * @param {TextManager} options.text - the text manager
         * @param {HandlerSet} options.handlers - the event handlers
         */
        constructor(id, options){
            super(id, "SvgGraph");

            var thisClass = this;
            
            if(typeof options.handlers === "undefined" || options.handles === null){
                console.warn("no handlers detected. This graph will be unresponsive");
            }
            
            // Set utility objects if provided
            options = (!options) ? {} : options;
            thisClass._utility = {};
            thisClass._utility.text = (!options.text) ? null : options.text;
            thisClass._utility.planner = (!options.planner) ? null : options.planner;
            thisClass._handlers = (!options.handlers) ? null : options.handlers;
            thisClass._overrides = (!options.overrides) ? null : options.overrides;
            
            // Verify handler type
            if(thisClass._handlers){
                assertType(thisClass._handlers, "HandlerSet");
            }
            
            // Construct DOM element
            thisClass.name = "SvgGraph";
            thisClass._$el = $(document.createElementNS("http://www.w3.org/2000/svg", "g"));
            
            // Construct a sizer element
            thisClass._$sizer = $(document.createElementNS("http://www.w3.org/2000/svg", "text"));
            thisClass._$sizer[0].setAttribute("class","svg-sizer-text");
            thisClass.elem()[0].appendChild(thisClass._$sizer[0]);
            thisClass._$sizerspan = $(document.createElementNS("http://www.w3.org/2000/svg", "tspan"));
            thisClass._$sizer[0].appendChild(thisClass._$sizerspan[0]);
            thisClass._$sizerspan[0].setAttribute("display","none");
            thisClass._$sizerspan[0].setAttribute("class","svg-sizer-span");
            
            
            // Construct edge area
            thisClass._$edgeG = $(document.createElementNS("http://www.w3.org/2000/svg", "g"));
            thisClass.elem()[0].appendChild(thisClass._$edgeG[0]);
            
            // Construct node area
            thisClass._$nodeG = $(document.createElementNS("http://www.w3.org/2000/svg", "g"));
            thisClass.elem()[0].appendChild(thisClass._$nodeG[0]);
            
            thisClass.listenForChange("transformx", thisClass.listenNow);
            thisClass.listenForChange("transformy", thisClass.listenNow);
            thisClass.listenForChange("transformscale", thisClass.listenNow);
            
            thisClass.elem()[0].setAttribute("class", "svg-sub-graph");
            

            var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            thisClass.elem()[0].appendChild(defs);

            // Marker
            var marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
            defs.appendChild(marker);

            marker.setAttribute("id", "arrow");
            marker.setAttribute("markerWidth", "5.5");   // Width of marker viewport (larger than desired width)
            marker.setAttribute("markerHeight", "5.5");  // Height of marker viewport (larger than desired height)
            marker.setAttribute("refX", "8");           // X coord of midpoint 
            marker.setAttribute("orient", "auto");      // Re-orients the marker to the line end
            marker.setAttribute("viewBox", "0 -5 10 10");
            
            var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            marker.appendChild(path);
            path.setAttribute("d", "M0,-5L10,0L0,5");
            
            // Gradients
            
            function addGradient(from,to){
                var grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
                defs.appendChild(grad);
                grad.setAttribute("id", "grad_" + from+to);
                
                var stopFrom = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                grad.appendChild(stopFrom);
                stopFrom.setAttribute("stop-color", from);
                
                var stopFromBuffer = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                grad.appendChild(stopFromBuffer);
                stopFromBuffer.setAttribute("offset", "40%");
                stopFromBuffer.setAttribute("stop-color", from);
                
                /*var stopMid = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                grad.appendChild(stopMid);
                stopMid.setAttribute("offset", "50%");
                stopMid.setAttribute("stop-color", "#d800ff");*/
                
                var stopToBuffer = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                grad.appendChild(stopToBuffer);
                stopToBuffer.setAttribute("offset", "60%");
                stopToBuffer.setAttribute("stop-color", to);
                
                var stopTo = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                grad.appendChild(stopTo);
                stopTo.setAttribute("offset", "100%");
                stopTo.setAttribute("stop-color", to);
            }
            
            addGradient("red", "blue");
            addGradient("red", "gray");
            addGradient("blue", "red");
            addGradient("blue", "gray");
            addGradient("gray", "red");
            addGradient("gray", "blue");
        }
        
        /**
         * Get the combined boundary data for nodes or edges
         * @param {string} type - (edge|node)
         * @returns {undefined}
         */
        bounds(type){
            var thisClass = this;
            assert(type === 'edge' || type === 'node');
            
            var itemBounds = [];
            thisClass.get(type + "s").forEach(function(item){
                itemBounds.push(item.value.bounds());
            });
            return pvt.reduceBounds(itemBounds);
        }
        
        listenNow(){
            var k = 0;
        }

        default(){
            var thisClass = this;
            return {
                // Preserve nodes if they exist
                nodes: (thisClass._data && thisClass._data.nodes) ? thisClass._data.nodes : new JsClass.Hash(),

                // Preserve nodes if they exist
                edges: (thisClass._data && thisClass._data.edges) ? thisClass._data.edges : new JsClass.Hash(),
                
                // Reset the drag
                drag: {
                    start: null,
                    curr: null
                },
                
                animate: false,
                
                // Reset class
                class: [],
            }
        }

        /**
         * 
         * @returns {boolean} - true: success, false: fail
         */
        _draw(){
            var thisClass = this;
            
            if(thisClass.changed()){
                if(thisClass._utility.planner === null){
                    console.warn("no graph planner provided. ignoring graph render.");
                    return false;
                }else{
                    // Set the classes
                    
                    
                    // Use dagre to plan the graph
                    // This step is REALLY expensive so avoid at all costs
                    var planGraph = false;
                    
                    // New nodes were added
                    if(thisClass._changed.hasOwnProperty("newnode") && thisClass._changed.newnode > 0){ 
                        planGraph = true;
                    }
                    
                    // Nodes were removed
                    if(thisClass._changed.hasOwnProperty("stalenode") && thisClass._changed.stalenode > 0){ 
                        planGraph = true;
                    }
                    
                    // Edges were removed
                    if(thisClass._changed.hasOwnProperty("indirect")){
                        planGraph = true;
                    }
                    
                    // Nodes in the graph have changed. If they are transforms the replan
                    if(!planGraph && thisClass._changed.hasOwnProperty("nodeChanged")){
                        var anyTransform = (typeof thisClass._changed.nodeChanged.forEach(function(d){
                            return (typeof (Object.keys(d).find(function(k){
                                return (k === "transformx" || k === "transformy" || k === "transformscale");
                            })) !== 'undefined');
                        }) !== 'undefined');
                        if(anyTransform){
                            planGraph = true;
                        }
                    }
                    
                    if(planGraph){                    
                        var graphAttr = thisClass._utility.planner.plan(thisClass._data.edges, thisClass._data.nodes, {});
                        
                        // Dagre provided values
                        if(graphAttr !== null){
                            
                            assertDefined(graphAttr.width);
                            assertDefined(graphAttr.height);
                            
                            thisClass.set("width", graphAttr.width);
                            thisClass.set("height", graphAttr.height);
                        }
                        
                        // Dagre did not provide values
                        else{
                            thisClass.set("width", null);
                            thisClass.set("height", null);
                        }
                    }
                    
                    // Remove the reset class and display the graph
                    thisClass._$el[0].setAttribute("class", thisClass.get("class").concat(["svg-sub-graph"]).join(" "));
                    
                    // Either the graph was re-planned or a node changed. Redraw the edges
                    if(planGraph || thisClass._changed.hasOwnProperty("edgeChanged")){
                        thisClass._data.edges.forEach(function(edgeItem){
                            edgeItem.value.draw();
                        });
                    }
                                        
                    // Either the graph was re-planned or a node changed. Redraw the nodes
                    if(planGraph || thisClass._changed.hasOwnProperty("nodeChanged")){
                        thisClass._data.nodes.forEach(function(nodeItem){
                            nodeItem.value.draw();
                        });
                    }                    
                    
                    // Either the graph has moved or it was re-planned. Move the graph to where it needs to be
                    if(planGraph || 
                       thisClass._changed.hasOwnProperty("transformx") || 
                       thisClass._changed.hasOwnProperty("transformy") || 
                       thisClass._changed.hasOwnProperty("transformz")){
                        thisClass.move();
                    }
                    
                    // Clear variables for next render detect
                    thisClass.set("newnode", 0);
                    thisClass.set("nodeChanged", []);
                    thisClass.set("stalenode", 0);
                    thisClass.set("newedge", 0);
                    thisClass.set("edgeChanged", []);
                    thisClass.set("staleedge", 0);
                    
                    return planGraph;
                }
            }
        }
        
        
        
        move(){
            var thisClass = this;
            
            // Apply the transform
            if(thisClass.has("transformx") && thisClass.has("transformy") && thisClass.has("transformscale")){
                var x = assertType(thisClass.get("transformx"), 'number');
                var y = assertType(thisClass.get("transformy"), 'number');
                var s = assertType(thisClass.get("transformscale"), 'number');
                
                var newTransform = "scale("+s+" "+s+") translate("+x +" " +y +")";
                //thisClass.elem()[0].setAttribute("transform","scale(-5.25 -5.13) translate(-7.8 -9.254)");
                
                //thisClass.animate(thisClass.elem()[0], {transform: {x: x, y: y, scale: s}}, 1000, 500);
                
                
                //if(thisClass.get("animate")){
                //    thisClass.animate(thisClass.elem()[0], {transform: {x: x, y: y, scale: s}}, 500, 100);
                //    thisClass.set("animate", false);
                //}else{
                    thisClass.elem()[0].setAttribute("transform",newTransform);
                    thisClass.elem()[0].setAttribute("style","");
                //}   
            }
            
        }
        
        

        reset(){
            var thisClass = this;
            thisClass._$el[0].setAttribute("class", "svg-sub-graph reset");
        }

        /**
         * Set the nodes in this graph to a new configuration
         * @param {EdgeDef[]} edges - the edge definitions
         * @param {Hash} storedEdges - Edges stored in the graph which may be viable
         * 
         * @return {SvgEdge[]} - edges that are no longer being used by the graph
         */
        setEdges(edges, storedEdges){
            var thisClass = this;

            // Validate the edges
            edges.forEach(function(d, i){
                assertDefined(d, "edge "+ i +": undefined/null");
                if(!d.hasOwnProperty("id")){ throw Error("edge "+ i +": no id provided"); }
                else if(!d.hasOwnProperty("src")){ throw Error("edge "+ i +": no source provided"); }
                else if(!d.hasOwnProperty("tgt")){ throw Error("edge "+ i +": no target provided"); }
                else if(!d.hasOwnProperty("dir")){ throw Error("edge "+ i +": no direct/indirect flag provided"); }
            });

            return pvt.setElems.call(thisClass, edges, "edge", thisClass._data.edges);
        }

        /**
         * Set the nodes in this graph to a new configuration
         * @param {NodeOb[]} nodes - the node definitions
         * @param {Hash} storedNodes - nodes stored in the graph which may be viable
         * 
         * @return {SvgNode[]} - nodes that are no longer being used by the graph
         */
        setNodes(nodes, storedNodes){
            var thisClass = this;
            
            // Validate the nodes
            nodes.forEach(function(d, i){
                // Override the font
                if(thisClass.has("nodefont")){
                    d.font = thisClass.get("nodefont");
                }
                
                // Override the min font size
                if(thisClass.has("minnodefontsize")){
                    d.minfontsize = thisClass.get("minnodefontsize");
                }
                
                if(typeof d === 'undefined' || d === null){ throw Error("node "+ i +": undefined/null");}
                else if(!d.hasOwnProperty("id")){ throw Error("node "+ i +": no id provided"); }
                else if(!d.hasOwnProperty("radius")){ throw Error("node "+ i +": no radius provided"); }
                else if(!d.hasOwnProperty("color")){ throw Error("node "+ i +": no color provided"); }
                else if(!d.hasOwnProperty("stroke")){ throw Error("node "+ i +": no stroke color provided"); }
                else if(!d.hasOwnProperty("strokewidth")){ throw Error("node "+ i +": no stroke width provided"); }
                else if(!d.hasOwnProperty("font")){ throw Error("node "+ i +": no font provided"); }
                else if(!d.hasOwnProperty("shape")){ throw Error("node "+ i +": no shape provided"); }
 
                d.text = (!d.hasOwnProperty("text")) ? null : d.text;
            });    

            return pvt.setElems.call(thisClass, nodes, "node", thisClass._data.nodes);
        }
    }

    /**
     * Create node and add to graph
     * 
     * @param {any} d - the definition
     * @param {string} type - the type of add
     */
    pvt.add = function(d, type){
        var thisClass = this;
        
        thisClass.set("freshNodes", false);
        thisClass.set("freshNodes", true);

        switch(type){
            case "node":
                // Create node and add to graph
                var node = pvt.newNode.call(thisClass, d.id, d);//new SvgNode(d.id, thisClass._text);
                thisClass._data.nodes.store(node.id, node);
                thisClass._$nodeG[0].appendChild(node.elem()[0]);
                node.set(d);
                break;
            case "edge":
                // Create edge and add to graph
                var edge = new SvgEdge(d.id, {handlers: thisClass._handlers, overrides: thisClass._overrides}, d);
                thisClass._data.edges.store(edge.id, edge);
                thisClass._$edgeG[0].appendChild(edge.elem()[0]);
                edge.set(d);
                break;
            default:
                throw Error("unknown type: " + type);
        }
    };

    /**
     * @param {any[]} elems - any element as long as it has an id
     * @param {Hash} current - any element as long as it has an id
     * @return {object} - categorizedNodes: freshNodes, staleNodes, stableNodes
     */
    pvt.categorize = function(elems, current){
        //var thisClass = this;
        var old = new JsClass.Set(current.map(function(d){
            return d.value.id;
        }));
        var young = new JsClass.Set(elems.map(function(d){
            return d.id;
        }));

        /** @type {NodeOb[]} - Fresh nodes to add to the graph*/
        var fresh = young.difference(old).map(function(d){
            return elems.find(function(i){
                return i.id == d;
            });
        });

        /** @type {SvgNode[]} - Stale nodes to be removed from the map*/
        var stale = old.difference(young).map(function(d){
            return current.fetch(d);
        });

        /** @type {NodeOb[]} - Nodes that haven't left but may have changed */
        var stable = old.intersection(young).map(function(d){
            return elems.find(function(i){
                return i.id == d;
            });
        });

        return {
            fresh: fresh,
            stale: stale,
            stable: stable
        };
    };

    pvt.convertRealSpaceToTransformedSpace = function(pageOffset){
        var thisClass = this;
        var svg = thisClass.elem().parent()[0];
        var pt = svg.createSVGPoint();
  
        pt.x = pageOffset.x;
        pt.y = pageOffset.y;
        var svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
        return {
            x: svgP.x,
            y: svgP.y
        };
        
        /*var bounds = thisClass.elem()[0].getBoundingClientRect();
        var transform = thisClass.get("transform");

        if(!thisClass.has("viewBoxScale")){
            var bounds = thisClass.elem()[0].getBoundingClientRect();
            var dagreWanted = {width: thisClass.get("width"), height: thisClass.get("height")};
            var actualSize = {width: bounds.width/transform.scale, height: bounds.height/transform.scale};
            var OneUnitX = actualSize.width/dagreWanted.width;
            var OneUnitY = actualSize.height/dagreWanted.height;
            thisClass.set("viewBoxScale", {x: OneUnitX, y: OneUnitY});
        }*/

        /*var dagreWanted = {width: thisClass.get("width"), height: thisClass.get("height")};
        var actualSize = {width: bounds.width, height: bounds.height};

        var OneUnitX = actualSize.width/dagreWanted.width;
        var OneUnitY = actualSize.height/dagreWanted.height;*/
        /*var viewBoxScale = thisClass.get("viewBoxScale");
        
        var mouse = {x: pageOffset.x - bounds.left, y: pageOffset.y - bounds.top};
        
        mouse.x = ((mouse.x - (transform.x*transform.scale))*(transform.scale)) + bounds.left;
        mouse.y = ((mouse.y - (transform.y*transform.scale))*(transform.scale)) + bounds.top; 

        return mouse;

        //MathJs.matrix([[1, 0, 0], [0, 1, 0], [0, 0, 1]])
        //throw Error(e);*/
    };
    
    pvt.convertTransformedSpaceToRealSpace = function(pageOffset){
        
    };
    
    pvt.newNode = function(id, node){
        var thisClass = this;
        
        var inst = SvgNode;
        
        if(thisClass._overrides !== null && thisClass._overrides.hasOwnProperty("node")){
            inst = thisClass._overrides.node;
        }
        return new inst(id, {
            text: thisClass._utility.text, 
            handlers: thisClass._handlers, 
            overrides: thisClass._overrides, 
            shape: node.shape,
            radius: node.radius
        });
    };

    /**
     * Remove a node
     * 
     * @param {SvgElem} elem - the node
     */
    pvt.remove = function(elem, type){
        var thisClass = this;

        switch(type){
            case "node":
                // Remove node
                thisClass._data.nodes.remove(elem.id);
                thisClass._$nodeG[0].removeChild(elem.elem()[0]);
                break;
            case "edge":
                // Remove node
                thisClass._data.edges.remove(elem.id);
                thisClass._$edgeG[0].removeChild(elem.elem()[0]);
                break;
            default:
                throw Error("unknown type: " + type);
        }
        elem.elem().unbind();
        elem.elem().remove();
    };
    
    /**
     * Reduces a list of bounds to a summary data item
     * 
     * @param {Object[]} bounds - the boundary set
     */
    pvt.reduceBounds = function(bounds){
        
        // Compile set
        var reduced = bounds.reduce(function(acc, val){
            if(acc === null){
                return { xmin: val.left, xmax: val.right, ymin: val.top, ymax: val.bottom };
            }else{
                return {
                    xmin: Math.min(acc.xmin,val.left),
                    xmax: Math.max(acc.xmax,val.right),
                    ymin: Math.min(acc.ymin,val.top),
                    ymax: Math.max(acc.ymax,val.bottom)
                }
            }
        },null);
        
        // Derive properties
        if(reduced !== null){
            // Derive the center
            reduced.center = {
                x: (reduced.xmin + reduced.xmax)/2,
                y: (reduced.ymin + reduced.ymax)/2
            };

            // Derive the width and height
            reduced.width = assertType(reduced.xmax - reduced.xmin, "number");
            reduced.height = assertType(reduced.ymax - reduced.ymin, "number");
        }
        
        
        return reduced;
    };

    /**
     * Set the elements in this graph to a new configuration
     * @param {any[]} elems - the definitions (anything as long as it has an id)
     * @param {string} type - type of element to add
     * @param {Hash} current - elements stored in the graph which may be viable (must have id)
     * @return {SvgElem[]} - elements that are no longer being used by the graph
     */
    pvt.setElems = function(elems, type, current){
        var thisClass = this;

        // Categorize nodes
        var categorizedNodes = pvt.categorize(elems, current);
        var fresh = categorizedNodes.fresh;
        var stale = categorizedNodes.stale;
        var stable = categorizedNodes.stable;
        var elemChanges = [];

        // Add fresh nodes to the graph
        thisClass.set("new"+type, fresh.length);
        fresh.forEach(function(d){
            pvt.add.call(thisClass, d, type);
        });

        // Modify stable nodes
        stable.forEach(function(d){
            var curr = current.fetch(d.id);
            curr.set(d);
            if(curr.changed()){
                elemChanges.push(curr._changed);
            }
        });

        // Remove stale nodes
        thisClass.set("stale"+type, stale.length);
        stale.forEach(function(d){
            pvt.remove.call(thisClass, d, type);
        });
        
        
        thisClass.set(type + "Changed", elemChanges);
        
        // Return stale nodes
        return stale;
    }
    
    return SvgGraph;
});