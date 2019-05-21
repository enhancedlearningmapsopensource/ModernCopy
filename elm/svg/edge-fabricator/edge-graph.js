/* global EdgeGraph, pvt */

define(["jsclass!3rdParty/jsclass/"], 
function(JsClass){
    class EdgeGraph{
        /**
         * Construct EdgeGraph instance
         * @param {string} raw - server string
         */
        constructor(raw){
            var thisClass = this;
            raw = (typeof raw === 'undefined') ? null : raw;
            
            thisClass.c = function(){throw Error();}
            
            thisClass._c = new JsClass.Hash();
            thisClass.p = new JsClass.Hash();
            thisClass.k = new JsClass.Set();
            
            pvt.parse.call(thisClass, raw);
        }
        
        /**
         * Copy the graph 
         * @param {number[]=} nodeIDs - if provided, only copy the given nodes
         * @returns {EdgeGraph}
         */
        copy(nodeIDs){
            var thisClass = this;
            if(!nodeIDs){
                nodeIDs = thisClass.k;
            }
            var validNodes = new JsClass.Set(nodeIDs.map(function(d){return d;}));
            
            var copy = new EdgeGraph();
            
            // Copy parents
            copy.p = pvt.copySet(thisClass.p, validNodes);
            
            // Copy children
            copy._c = pvt.copySet(thisClass._c, validNodes);
            
            // Copy k
            copy.k = nodeIDs.map(function(d){return d;});
            
            return copy;
        }
        
        /**
         * Extract the edge graph for local storage
         * @return {Object}
         */
        extract(){
            var thisClass = this;
            var extracted = {};
            
            // Extract k
            extracted.k = thisClass.k.map(function(d){
                return d;
            });
            
            // Extract _c
            extracted._c = {};
            thisClass._c.forEach(function(item){
                extracted._c[item.key] = item.value;
            });
            
            // Extract p
            extracted.p = {};
            thisClass.p.forEach(function(item){
                extracted.p[item.key] = item.value;
            });
            
            return extracted;
        }
        
        /**
         * Get path between nodes
         * @param {EdgeGraph} edgeGraph
         * @param {number} from
         * @param {number} to
         * @param {Set} ignore
         * @param {direct=true} allowDirect
         * @return {(number[]|null)} - if any path exists then return a path between, otherwise return null
         */
        findPath(from, to, ignore, allowDirect){
            var edgeGraph = this;
            
            var childrenOfFrom = edgeGraph.getChildrenOf(from);
            
            assertType(from, 'number');
            assertType(to, 'number');
            ignore = (!ignore) ? new JsClass.Set() : ignore;
            
            allowDirect = (typeof allowDirect === 'undefined' || allowDirect === null) ? true : allowDirect;
            
            // Check for no connections
            if(childrenOfFrom === null || childrenOfFrom.length == 0){                
                return null;
            }
            
            // Check for a direct connection
            else if(allowDirect && childrenOfFrom.find(function(d){return d == to;})){                
                return [from,to];
            }
            
            
            var open    = new JsClass.Set();
            var closed  = new JsClass.Set();
            var past    = new JsClass.Hash();   /* Key: To, Value: From */
            open.add(from);
            
            // Scan through nodes in the open set
            while(!open.isEmpty()){
                // Select and remove first node and add to closed
                var curr = open.first();
                open.remove(curr);
                closed.add(curr);
                
                // We have arrived at the current node so construct the path
                if(curr == to){
                    var at      = to;
                    var path    = [];
                    while(at != from){
                        path.unshift(at);
                        at = past.fetch(at);
                    }
                    path.unshift(at);
                    
                    if(allowDirect){
                        return path;
                    }else if(path.length > 2){
                        return path;
                    }
                }
                
                // Still searching
                else{
                    // Get children of current node
                    var children = edgeGraph.getChildrenOf(curr);
                    if(children !== null){                
                        children.forEach(function(d){
                            if(to == d){
                                open.add(d);
                                past.store(d, curr);
                            } else if(!open.contains(d) && !closed.contains(d) && !ignore.contains(d)){
                                open.add(d);
                                past.store(d, curr);
                            }
                        });
                    }
                }
            }

            // Could not find a path
            return null;
        }
        
        /**
         * Get path between nodes
         * @param {number[]} nodeIDs
         * @param {boolean=true} allowIndirect - turn on/off indirect paths
         * @return {number[], null} - if any path exists then return a path between, otherwise return null
         */
        findPaths(nodeIDs, allowIndirect){
            var thisClass = this;
            var paths = [];
            var ignore = new JsClass.Set(nodeIDs);
            allowIndirect = (typeof allowIndirect === 'undefined') ? true : allowIndirect;            
            
            for(var i = 0; i < nodeIDs.length; i++){
                var nodeA = nodeIDs[i];
                for(var j = 0; j < nodeIDs.length; j++){
                    if(i !== j){
                        var nodeB = nodeIDs[j];
                        var path = thisClass.findPath(nodeA, nodeB, ignore, true);
                        if(path !== null){
                            // The path is direct
                            if(path.length == 2){
                                
                                // Add the path
                                paths.push({
                                    from: nodeA,
                                    to: nodeB,
                                    path: path.map(function(d){return d;})
                                });
                                
                                // Search for an indirect path
                                if(allowIndirect){
                                    path = thisClass.findPath(nodeA, nodeB, ignore, false);

                                    // Found an indirect path
                                    if(path !== null){
                                        paths.push({
                                            from: nodeA,
                                            to: nodeB,
                                            path: path.map(function(d){return d;})
                                        });
                                    }
                                }
                            }
                            
                            // The path is indirect
                            else if(allowIndirect){
                                paths.push({
                                    from: nodeA,
                                    to: nodeB,
                                    path: path.map(function(d){return d;})
                                });
                            }
                        }
                    }
                }
            }   
            return paths;
        }
        
        /**
         * Get the children of a given node 
         * 
         * @param {number} nodeid - the id of the node to get
         * @return {number[]} - the ids of the children of the given node
         */
        getChildrenOf(nodeid) {
            var thisClass = this;
            assertType(nodeid, 'number');

            if (thisClass._c.hasKey(nodeid)) {
                return assertType(thisClass._c.fetch(nodeid), 'number[]');
            } else {
                return [];
            }
        }

        /**
         * Get the parents of a given node 
         * 
         * @param {number} nodeid - the id of the node to get
         * @return {number[]} - the ids of the parents of the given node
         */
        getParentsOf(nodeid) {
            var thisClass = this;
            assertType(nodeid, 'number');

            var parents = thisClass.p.assoc(nodeid);
            if (parents === null) {
                return [];
            } else {
                return assertType(parents.value, 'number[]');
            }
        }
        
        restore(extracted){
            var thisClass = this;
            thisClass.k = new JsClass.Set(extracted.k);
            thisClass.p = new JsClass.Hash();
            thisClass._c = new JsClass.Hash();
            
            Object.keys(extracted.p).forEach(function(key){
                thisClass.p.store(Number(key), extracted.p[key]);
            });
            Object.keys(extracted._c).forEach(function(key){
                thisClass._c.store(Number(key), extracted._c[key]);
            });
        }
        
        /**
         * Get the upper/lower tree using bfs
         * @param {number[]} nodeIDs
         * @param {string} direction - (UP|DN|IN) UP: Upper tree, DN: Lower tree, IN: Intersection of upper and lower trees
         * @returns {EdgeGraph}
         */
        tree(nodeIDs, direction){
            var thisClass = this;
            var nodesInTree = [];

            // Find the inner tree
            if(direction === "IN"){
                var nodesInUpTree = new JsClass.Set(pvt.getNodesInTree.call(thisClass, nodeIDs, "UP"));
                var nodesInDnTree = new JsClass.Set(pvt.getNodesInTree.call(thisClass, nodeIDs, "DN"));
                nodesInTree = nodesInUpTree.intersection(nodesInDnTree).toArray();
            }
            
            // Find either upper or lower tree
            else{
                nodesInTree = pvt.getNodesInTree.call(thisClass, nodeIDs, direction);
            }
            
            return thisClass.copy(nodesInTree.map(function(d){
                return d;
            }));
            
        }
        
        
    }
    
    var pvt = {
        
        /**
         * 
         * @param {JsClass.Set} set
         * @param {JsClass.Set} validNodes
         * @returns {JsClass.Set}
         */
        copySet: function(set, validNodes){
            var copy = new JsClass.Hash();
            set.map(function(d){
                if(validNodes.contains(d.key)){
                    return{
                        k: d.key,
                        v: d.value.map(function(val){
                            if(validNodes.contains(val)){
                                return val;
                            }else{
                                return null;
                            }
                        }).filter(function(val){
                            return (val !== null);
                        })
                    };
                }else{
                    return null;
                }
            }).filter(function(d){
                return (d !== null && d.v.length > 0);
            }).forEach(function(d){
                copy.store(d.k, d.v);
            });
            return copy;
        },
        
        /**
         * Get the upper/lower tree using bfs
         * @param {number[]} nodeIDs
         * @param {string} direction - (UP|DN) UP: Upper tree, DN: Lower tree
         * @returns {number[]}
         */
        getNodesInTree(nodeIDs, direction){
            var thisClass = this;
            
            assertType(nodeIDs, 'number[]');
            assertType(direction, 'string');
            
            var open    = new JsClass.Set(nodeIDs);
            var closed  = new JsClass.Set();
            
            while(!open.isEmpty()){
                var curr = open.first();
                open.remove(curr);
                closed.add(curr);
                
                var next = null;
                switch(direction){
                    case "UP":
                        next = thisClass.getParentsOf(curr);
                        break;
                    case "DN":
                        next = thisClass.getChildrenOf(curr);
                        break;
                    default:
                        throw Error("unknown direction: " + direction);
                }
                
                if(next !== null){
                    next.filter(function(d){
                        return (!open.contains(d) && !closed.contains(d));
                    }).forEach(function(d){
                        open.add(d);
                    });
                }
            }
            return assertType(closed.toArray(), 'number[]');
        },
        
        /**
         * Parse the given server string to build the edge graph
         * @param {string} raw - server string
         */
        parse: function (raw){
            var thisClass = this;
            if (raw === null) {
                return;
            }

            try{
                var data = JSON.parse(raw);
            }catch(err){
                throw Error("error parsing data: " + raw);
            }
            var expectedEdgeCnt = data.edgecnt;
            var edges = data.edges;
            thisClass.k = new JsClass.Set();
            
            edges.forEach(function(e){
               var parent = e.p;
               var children = e.c;
               
               thisClass._c.store(e.p, e.c);
               thisClass.k.add(parent);
               
               e.c.forEach(function(child){
                   thisClass.k.add(child);
                   if(!thisClass.p.hasKey(child)){
                       thisClass.p.store(child, []);
                   }
                   thisClass.p.fetch(child).push(parent);
               });
            });
        },
        
        /**
         * Process keys imported by the parse function
         */
        processKeys: function(){
            var thisClass = this;

            var parentKeys = thisClass.p.keys();
            var childrenKeys = thisClass.c.keys();

            parentKeys.sort();
            childrenKeys.sort();

            var p = 0;
            var c = 0;
            var k = [];
            while (p < parentKeys.length && c < childrenKeys.length) {
                var pKey = parentKeys[p];
                var cKey = childrenKeys[c];
                if (pKey == cKey) {
                    childrenKeys.splice(c, 1);
                    c--;
                    if (c < 0) {
                        c = 0;
                    }
                } else if (pKey < cKey) {
                    k.push(pKey);
                    p++;
                } else {
                    k.push(cKey);
                    c++;
                }
            }
            while (p < parentKeys.length) {
                k.push(parentKeys[p]);
                p++;
            }
            while (c < childrenKeys.length) {
                k.push(childrenKeys[c]);
                c++;
            }
            k.sort();
            for (var i = 0; i < k.length - 1; i++) {
                if (k[i] == k[i + 1]) {
                    k.splice(i, 1);
                    i--;
                }
            }
            thisClass.k = k;
            thisClass.length = k.length;
        }
    };
    
    return EdgeGraph;
});


