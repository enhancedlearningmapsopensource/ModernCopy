/**
 *  Given:
 *      a) Set of edges (nodeA, nodeB, style)
 *      b) Set of nodes (nodeid, text)
 *
 *  Produce:
 *      dagre graph of the nodes and edges
 */ 
define(["dagre2",
        "dagre",
        "d3"],
function (dagre,
          dagreOld,
          d3) {

    var pvt = {};

    class GraphPlanner {
        constructor() {

        }

        /**
         * Plan the graph
         * 
         * @param {Hash} edgeSet - SvgEdge objects
         * @param {Hash} nodeSet - SvgNode objects
         * @param {object} options
         * @param {number} options.r - circle radius
         * @param {number} options.nodeSep - circle separation
         * @param {number} options.rankSep - circle rank separation
         * @param {boolean=false} options.smooth - smooth edges
         * @returns 
         * 
         * @memberof GraphPlanner
         */
        plan(edgeSet, nodeSet, options) {

            // validate input
            assertDefined(edgeSet, "edge set not provided");
            assertDefined(nodeSet, "node set not provided");

            // Quick exit
            if(nodeSet.length == 0){
                return {
                    width: 0,
                    height: 0
                };
            }
            
            var thisView = this;
            var thisGraph = thisView.model;

            var nodeWidth = null,
                nodeHeight = null,
                graphDirection = "TB",  /** No idea! **/
                nodeSeparation = 30,
                rankSeparation = 30,
                smooth = false;


            var nodes = nodeSet.map(function(d){return d.value;});
            var edges = edgeSet.map(function(d){return d.value;});

            if(options){
                nodeWidth = (typeof options.r !== 'undefined' && options.r !== null) ? 2 * options.r : nodeWidth;//GraphConstants.RADIUS;
                nodeHeight = (typeof options.r !== 'undefined' && options.r !== null) ? 2 * options.r : nodeHeight;
                nodeSeparation = (typeof options.nodeSep !== 'undefined' && options.nodeSep !== null) ? options.nodeSep : nodeSeparation;//constants.DEFAULT_NODE_SEPARATION;
                rankSeparation = (typeof options.rankSep !== 'undefined' && options.rankSep !== null) ? options.rankSep : rankSeparation;//constants.DEFAULT_RANK_SEPARATION;
                smooth = (typeof options.smooth !== 'undefined' && options.smooth !== null) ? options.smooth : false;//constants.DEFAULT_RANK_SEPARATION;
            }


            var layout = null;
            try{
                var dagreGraph = new dagre.graphlib.Graph({ directed: true, multigraph: true, compound: true });

                dagreGraph.setGraph({});
                dagreGraph.setDefaultEdgeLabel(function () { return {}; });

                var lrOrder = true;
                var transX = 0;
                var transY = 0;
                var pNodeTrans = null;

                nodes.forEach(function (node) {
                    var w = (nodeWidth === null) ? (1.1*2*(node.get("radius"))) : nodeWidth;
                    var h = w;
                    dagreGraph.setNode(node.id, { width: w, height: h });
                });

                edges.forEach(function (edge) {
                    dagreGraph.setEdge({ v: edge.get("src"), w: edge.get("tgt"), name: edge.id.toString() });
                });

                var layoutOptions = {};
                layoutOptions.graph = {};

                dagreGraph.graph().rankdir = graphDirection;	// Direction for rank nodes. Can be TB, BT, LR, or RL, where T = top, B = bottom, L = left, and R = right.
                dagreGraph.graph().nodesep = nodeSeparation;	// Number of pixels that separate nodes horizontally in the layout.
                dagreGraph.graph().ranksep = rankSeparation;	// Number of pixels between each rank in the layout.
            
                try{
                    dagre.layout(dagreGraph, layoutOptions);
                } catch (ex) {
                    console.log("Error during dagre layout: " + ex);
                    throw Error("try other");
                }
                dagreGraph.old = false;
                layout = dagreGraph;

            } catch (ex) {
                console.warn("GraphPlanner.plan: dagre failed. Using old version.");
                var dagreGraph = new dagreOld.Digraph();

                try{
                    nodes.forEach(function (node) {
                        console.log("nodeID: " + node.id);
                        dagreGraph.addNode(node.id, { width: nodeWidth, height: nodeHeight });
                    });

                    edges.forEach(function (edge) {
                        console.log("edge: {v: " + edge.src + ", w: " + edge.tgt + ", name: " + edge.id + "}");
                        dagreGraph.addEdge(edge.id, edge.src, edge.tgt);
                    });

                    var layout = dagreOld.layout()
                                  .rankSep(rankSeparation)
                                  .nodeSep(nodeSeparation) // TODO move defaults to consts
                                  .rankDir(graphDirection)
                                  .run(dagreGraph);
                    layout.old = true;
                    //return layout;
                } catch (ex) {
                    console.log(ex);
                }
            }
            
            if(layout !== null){

                // Transfer dagre data to nodes
                nodes.forEach(function(d){
                    var nodeOb = layout.node(d.id);
                    d.set("transform", {x: nodeOb.x, y: nodeOb.y});
                });

                // Transfer dagre data to edges
                edges.forEach(function(d){
                    var edgeOb = layout.edge(d.get("src"), d.get("tgt"), d.id);

                    var path = edgeOb.points.map(function(p){
                        return {
                            x: p.x,
                            y: p.y
                        }
                    });
                    if(path.length > 0){
                        // Add the source and target node
                        if(!nodeSet.hasKey(d.get("src"))){
                            throw Error("source node does not appear to exist: " + d.get("src"));
                        }
                        if(!nodeSet.hasKey(d.get("tgt"))){
                            throw Error("target node does not appear to exist: " + d.get("tgt"));
                        }

                        path.unshift(nodeSet.fetch(d.get("src")).get("transform"));
                        path.push(nodeSet.fetch(d.get("tgt")).get("transform"));

                        // Smooth the path
                        if(smooth){
                            for(var i = 0; i < path.length - 2; i++){
                                var a = path[i];
                                var b = path[i+1];
                                var c = path[i+2];

                                var ab = pvt.norm(pvt.sub(b,a));
                                var bc = pvt.norm(pvt.sub(c,b));

                                var dist = pvt.sub(ab,bc);
                                var mag = pvt.mag(dist);

                                if(mag < 0.1){
                                    // Remove b
                                    path.splice(i+1, 1);
                                    i--;
                                }
                            }
                        }

                        path.shift();
                        path.pop();

                        d.set("path", path);
                        pvt.smoothEdge(d, nodeSet.fetch(d.get("src")), nodeSet.fetch(d.get("tgt")));
                    }
                });

                // Assemble graph data
                var graphDim = layout.graph();
                return {
                    width: graphDim.width,
                    height: graphDim.height,
                    ranksep: rankSeparation
                };
            }else{
                return null;
            }
        }
    };

    pvt.smoothEdge = function(edge, source, target){
        var path = edge.get("path");
        var srcPt = source.get("transform");
        var targetPt = target.get("transform");
        
        var penUltPt = path.length ? path[path.length - 1] : srcPt;
        var targetEndPt = pvt.computeEndPt(penUltPt, targetPt, target.get("radius")).target;

        path.unshift(srcPt);
        path.push(targetEndPt);

        var d3Line = d3.svg.line()
                .x(function (d) { return d.x === undefined ? d.get("x") : d.x; })
                .y(function (d) { return d.y === undefined ? d.get("y") : d.y; })
                .interpolate('basis')
                .tension(0.85);

        edge.set("path",d3Line(path));
    };

    /**
     * computes intersection points for two circular nodes (simple geometry)
     */
    pvt.computeEndPt = function(src, tgt, nodeRadius) {
        /*var srcT	= src.get("transform");
        var tgtT	= tgt.get("transform");*/
        var srcX = src.x;
        var srcY = src.y;
        var tgtX = tgt.x;
        var tgtY = tgt.y;
        var ratio = Math.pow((srcY - tgtY) / (srcX - tgtX), 2);
        var offX = nodeRadius / Math.sqrt(1 + ratio) * (srcX > tgtX ? -1 : 1);
        var offY = nodeRadius / Math.sqrt(1 + 1 / ratio) * (srcY > tgtY ? -1 : 1);

        // keep source at origin since we don't have an end marker
        return { source: { x: srcX + offX, y: srcY + offY }, target: { x: tgtX - offX, y: tgtY - offY } };
    };

    /**
     * @param {Vec2} b
     * @param {Vec2} c
     */
    pvt.mag = function(b, c){
        if(!c){
            return pvt.mag(b, {x: 0, y: 0});
        }
        var sub = pvt.sub(b,c);
        return Math.sqrt(sub.x*sub.x + sub.y*sub.y);
    };

    pvt.norm = function(a){
        var mag = pvt.mag(a);
        return {
            x: a.x/ mag,
            y: a.y/ mag
        }
    };

    pvt.sub = function(a, b){
        return {x: a.x - b.x, y: a.y - b.y};
    };
    pvt.add = function(a, b){
        return {x: a.x + b.x, y: a.y + b.y};
    };
    pvt.scale = function(a, s){
        return {x: a.x*s, y: a.y*s};
    };

    return GraphPlanner;
});
