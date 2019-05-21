/**
 *  Given:
 *      a) Set of edges (nodeA, nodeB, style)
 *      b) Set of nodes (nodeid, text)
 *
 *  Produce:
 *      dagre graph of the nodes and edges
 */ 
define(["constants",
        "corestate/js/graphs/graph-constants",
        "dagre2",
        "dagre"],
function (constants,
          GraphConstants,
          dagre,
          dagreOld) {

    class GraphPlanner {
        constructor() {

        }

        planGraph(options) {
            //console.log("planning... 0");
            var edges = options.edges;
            var nodes = options.nodes;

            //console.log("optimizing...");
            var thisView = this;
            var thisGraph = thisView.model;
            var nodeWidth = 2 * GraphConstants.RADIUS + 8;
            var nodeHeight = 2 * GraphConstants.RADIUS + 8;
            //console.log("planning... 1");

            var graphDirection = "TB"; /** No idea! **/
            var nodeSeparation = constants.DEFAULT_NODE_SEPARATION;
            var rankSeparation = constants.DEFAULT_RANK_SEPARATION;


            try{
                var dagreGraph = new dagre.graphlib.Graph({ directed: true, multigraph: true, compound: true });

                //console.log("planning... 2");

                dagreGraph.setGraph({});

                //console.log("planning... 3");

                dagreGraph.setDefaultEdgeLabel(function () { return {}; });

                //console.log("planning... 4");


                var lrOrder = true;
                var transX = 0;
                var transY = 0;
                var pNodeTrans = null;

                nodes.forEach(function (node) {
                    //console.log("nodeID: " + node.id);
                    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
                });

                //console.log("planning... 5");

                edges.forEach(function (edge) {
                    //console.log("edge: {v: " + edge.source + ", w: " + edge.target + ", name: " + edge.id + "}");
                    dagreGraph.setEdge({ v: edge.source, w: edge.target, name: edge.id });
                });

                //console.log("planning... 6");

                var layoutOptions = {};
                layoutOptions.graph = {};

                //console.log("planning... 7");

                dagreGraph.graph().rankdir = graphDirection;	// Direction for rank nodes. Can be TB, BT, LR, or RL, where T = top, B = bottom, L = left, and R = right.
                //layoutOptions.graph.align =	"UL";			// Alignment for rank nodes. Can be UL, UR, DL, or DR, where U = up, D = down, L = left, and R = right.
                dagreGraph.graph().nodesep = nodeSeparation;	// Number of pixels that separate nodes horizontally in the layout.
                //layoutOptions.graph.edgesep = 10;				// Number of pixels that separate edges horizontally in the layout.
                dagreGraph.graph().ranksep = rankSeparation;	// Number of pixels between each rank in the layout.
                //layoutOptions.graph.marginx = 0;				// Number of pixels to use as a margin around the left and right of the graph.
                //layoutOptions.graph.marginy = 0;				// Number of pixels to use as a margin around the top and bottom of the graph.
                //layoutOptions.graph.acyclicer = undefined;		// If set to greedy, uses a greedy heuristic for finding a feedback arc set for a graph. A feedback arc set is a set of edges that can be removed to make a graph acyclic.
                //layoutOptions.graph.ranker = "network-simplex";	// Type of algorithm to assigns a rank to each node in the input graph. Possible values: network-simplex, tight-tree or longest-path
                //layoutOptions.node = {};
                //layoutOptions.node.width = nodeWidth;			//The width of the node in pixels.
                //layoutOptions.node.height = nodeHeight;			//The height of the node in pixels.
                //layoutOptions.edge = {};
                //layoutOptions.edge.minlen = 1;					//The number of ranks to keep between the source and target of the edge.
                //layoutOptions.edge.weight = 1;					//The weight to assign edges. Higher weight edges are generally made shorter and straighter than lower weight edges.
                //layoutOptions.edge.width = 0;					//The width of the edge label in pixels.
                //layoutOptions.edge.height = 0;					//The height of the edge label in pixels.
                //layoutOptions.edge.labelpos = "r";				//Where to place the label relative to the edge. l = left, c = center r = right.
                //layoutOptions.edge.labeloffset = 10;			//How many pixels to move the label away from the edge. Applies only when labelpos is l or r.

                console.log("planning... 8");
            
                try{
                    dagre.layout(dagreGraph, layoutOptions);
                } catch (ex) {
                    console.log("Error during dagre layout: " + ex);
                    throw Error("try other");
                }
                dagreGraph.old = false;
                return dagreGraph;

            } catch (ex) {
                var dagreGraph = new dagreOld.Digraph();

                try{
                    nodes.forEach(function (node) {
                        console.log("nodeID: " + node.id);
                        dagreGraph.addNode(node.id, { width: nodeWidth, height: nodeHeight });
                    });

                    edges.forEach(function (edge) {
                        console.log("edge: {v: " + edge.source + ", w: " + edge.target + ", name: " + edge.id + "}");
                        dagreGraph.addEdge(edge.id, edge.source, edge.target);
                    });

                    var layout = dagreOld.layout()
                                  .rankSep(rankSeparation)
                                  .nodeSep(nodeSeparation) // TODO move defaults to consts
                                  .rankDir(graphDirection)
                                  .run(dagreGraph);
                    layout.old = true;
                    return layout;
                } catch (ex) {
                    console.log(ex);
                }
            }
            

            console.log("planned... ");



            
        }
    }

    return GraphPlanner;
});
