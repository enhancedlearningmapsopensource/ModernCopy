/**
 * @typedef {Object} EdgeDef
 * @property {int} source - the id of the source node
 * @property {int} target - the id of the target node
 * @property {int[]=} conceals - ids of concealed nodes
 *
 * global EdgeFabricator
 * 
 */
define(["./edge-graph",
        "jsclass!3rdParty/jsclass/"],
function(EdgeGraph,
         JsClass){
    
    /**
     * 
     * @name edge-fabricator/EdgeFabricator
     * 
     */
    class EdgeFabricator{
        /**
         * Creates a new instance of the edge fabricator
         * @param {?string} raw - the raw data to construct edges from
         * @param {?string} path - path to the raw edge data
         * 
         * @note - providing a value for 'raw' will cause the edges to be parsed,
         * while providing a value for 'path' will not result in any extra work.
         */
        constructor(raw, path) {
            var thisClass = this;
            if(typeof raw !== 'undefined' && raw !== null){
                thisClass.edgeGraph = new EdgeGraph(raw);
            }else if(typeof path !== 'undefined' && path !== null){
                thisClass.path = path;
            }
        }
        
        /**
         * 
         * @returns {undefined}
         */
        fetch(){
            var thisClass = this;
            return new Promise(function(resolve, reject){
                $.post(thisClass.path, {sessionid: sessionID}, function (raw) {
                    thisClass.edgeGraph = new EdgeGraph(raw);
                    if(!thisClass.edgeGraph){
                        throw new Exception("Unable to load edge graph from raw data. Data:" + raw.substr(0,40));
                    }
                    resolve(thisClass.edgeGraph.extract());
                });
            });
        }
        
        /**
         * Get the edges present in the graph formed by the subset of the given nodes
         * @param {number[]|string} nodeIDs - a comma separated list of node ids or an array of ids of nodes present in the graph
         * @param {boolean} indirect - if true then indirect edges are allowed, otherwise they are not
         * @return {EdgeDef[]} - list of edges in the graph
         */
        getEdges(nodeIDs, indirect){
            var thisClass = this;
            
            // Preprocess node ids
            nodeIDs = pvt.preprocessNodeIDs(nodeIDs);
            
            // Validate the node ids
            pvt.validateNodeIDs(nodeIDs);
            
            // Remove duplicates
            removeDuplicates(nodeIDs);
            
            // Get the edge graph
            var edgeGraph = thisClass.edgeGraph;   
            
            // Form a new edge graph from the nodes present
            var innerTree = edgeGraph.tree(nodeIDs, "IN");
            var paths = innerTree.findPaths(nodeIDs, indirect);
            
            return paths.map(function(d){
                return {
                    src: d.from,
                    tgt: d.to,
                    dir: (d.path.length == 2)
                };
            });
        }
        
        /**
         * Get a shallow copy of the children IDs associated with the given node
         * @param {number} nodeID
         * @returns {number[]}
         */
        getChildrenOf(nodeID){
            return this.edgeGraph.getChildrenOf(nodeID).map(function(d){
                return d;
            });
        }
        
        /**
         * Get a shallow copy of the parent IDs associated with the given node
         * @param {number} nodeID
         * @returns {number[]}
         */
        getParentsOf(nodeID){
            return this.edgeGraph.getParentsOf(nodeID).map(function(d){
                return d;
            });
        }
        
        restore(edgeData){
            var thisClass = this;
            thisClass.edgeGraph = new EdgeGraph();
            thisClass.edgeGraph.restore(edgeData);
        }
    } 
    
    var pvt = {        
        /**
         * Preprocess the list of ids
         * @param {string|number[]|function} ids - list of node ids
         * @return {number[]} ids - list of node ids
         */
        preprocessNodeIDs: function(ids){
            // Make sure ids are defined
            assertDefined(ids);
            
            // IDs are in an array
            if($.isArray(ids)){
                // Copy and return
                return ids.map(function(d){return d;});
            }
            
            // IDs are a string so split on ',' and return
            else if(typeof ids === 'string'){
                return ids.split(",").map(function(d){return Number(d);});
            }
            
            // IDs are a function so evaluate and preprocess recursively
            else if(typeof ids === 'function'){
                return pvt.preprocessNodeIDs(ids());
            }
        },
        
        /**
         * Validate the list of ids
         * @param {number[]} ids - ids to validate
         */
        validateNodeIDs: function(ids){
            assertType(ids, 'number[]');
            ids.forEach(function(d){
                assertType(d, 'number');
            });
        }
    };
    
    return EdgeFabricator;
});


