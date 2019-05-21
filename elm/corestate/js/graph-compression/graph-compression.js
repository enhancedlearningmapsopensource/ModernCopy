/**
 * 
 * @return {undefined}
 */


define(["lzstring"], function(LzString){
    var pvt = {
        consts: {
            VERSION: "0.0.0"
        }
    };
    
    class GraphCompressor{
        
        /**
         * Compress a graph for url transmission
         * 
         * @param {Object[]} nodes - set of nodes with associated attributes
         * @param {Object[]} attributeValues - list of attributes (keys) and their value spectrums (values)
         * @return {string} - url ready string
         */
        compress(nodes, attributeValues){
            var thisClass = this;
            if(!attributeValues){
                attributeValues = {};
                thisClass.deriveAttributeValues(nodes, attributeValues);
            }
            
            // Compute ordered attribute set
            var attributes = Object.keys(attributeValues);
            
            // Split on attributes
            var split = thisClass.splitOnFirst(nodes, attributes);
            
            // Combine attributes
            var combined = thisClass.combine(split, attributes, attributeValues);
            
            // Minimize the combined structure
            var minimized = thisClass.minimize(combined);
            
            // Add version
            minimized.version = pvt.consts.VERSION;
            
            // Compress to url
            var compressed = LzString.compressToEncodedURIComponent(JSON.stringify(minimized));
            
            return compressed;
        }
        
        /**
         * Decompress a graph for url transmission
         * 
         * @param {string} str - compressed url string
         * @param {Object} out - output object
         * @param {Object[]} out.nodes - decompressed nodes
         * @param {Object[]} out.attributeValues - decompressed list of attributes (keys) and their value spectrums (values)
         */
        decompress(str, out){
            var thisClass = this;
            
            // Validate
            assertDefined(out);
            
            // Prepare for data
            out.nodes = null;
            out.attributeValues = null;
            
            // Decompress from url
            var minimized = JSON.parse(LzString.decompressFromEncodedURIComponent(str));
            
            // Check the version
            if(minimized.version.localeCompare(pvt.consts.VERSION) !== 0){
                throw Error("Cannot decompress. Version is different.");
            }
            
            // Maximize the structure
            var combined = thisClass.maximize(minimized);
            
            // Uncombine the peices
            var initial = thisClass.shatter(combined);
            
            out.nodes = initial.nodes;
            out.attributeValues = initial.attr;
        }
        
        /**
         * Combines a split version and attribute data into a single object
         * that is then ready for minimization.
         *  
         * @param {Object[]} split - result of a node split operation
         * @param {string[]} attributes - an ORDERED list of attributes
         * @param {Object[]} attributeValues - list of attributes (keys) and their value spectrums (values)
         * @return {graph-compressionL#7.GraphCompressor.combine.graph-compressionAnonym$1}
         */
        combine(split, attributes, attributeValues){
            return {
                "attr": attributes.map(function(attr){
                    return {
                        name: attr,
                        vals: attributeValues[attr].map(function(d){
                            return d;
                        })
                    };
                }),
                "nodes": split.map(function(part){
                    return {
                        attr: attributes.map(function(attr){
                            return Number(part[attr]);
                        }),
                        nodes: part.nodes.sort()
                    };
                })
            };
        };
        
        deriveAttributeValues(nodes, attributeValues){
            // Determine attributes
            nodes.forEach(function(node){
                Object.keys(node).forEach(function(nodeAttrKey){
                    if(nodeAttrKey.localeCompare("id") !== 0 && nodeAttrKey.localeCompare("nodeid") !== 0){
                        // Add attribute if new
                        if(!attributeValues.hasOwnProperty(nodeAttrKey)){
                            attributeValues[nodeAttrKey] = [];
                        }
                        
                        // Find index
                        var nodeAttrVal = node[nodeAttrKey];
                        var index = null;
                        attributeValues[nodeAttrKey].find(function(v, i){
                            if(nodeAttrVal === v){
                                index = i;
                                return true;
                            }
                            return false;
                        });
                        
                        if(index === null){
                            index = attributeValues[nodeAttrKey].length;
                            attributeValues[nodeAttrKey].push(nodeAttrVal);
                        }
                        
                        node[nodeAttrKey] = index;
                    }
                });
            });
        }
        
        /**
         * Undoes minimize operation
         * 
         * @param {Object} ob - object to maximize
         * @return {Object} - maximized version
         */
        maximize(ob){
            var thisClass = this;
            return {
                attr: ob.attr,
                nodes: ob.nodes.map(function(set){
                    var arrs = thisClass.maximizeNumericArray(set);

                    var attr = arrs.shift();
                    var nodes = arrs.reduce(function(acc, d){
                        return acc.concat(d);
                    }, []);
                    return {
                        attr: attr,
                        nodes: nodes.sort()
                    };
                })
            };
        };
        
        /**
         * Undoes the numeric array minimization
         * 
         * @param {string} str - minimized array of arrays of integers
         * @return {number[][]} - a minimized string 
         */
        maximizeNumericArray(str){
            var arrSet = [];

            // Get the length of each followin number
            var tokens = str.split("").map(function(d){
                return Number(d);
            });

            while(tokens.length > 0){
                var arr = [];

                // Determine the number of items 
                var numStrLen = tokens.shift();
                var numItems = "";
                for(var i = 0; i < numStrLen; i++){
                    numItems += tokens.shift();
                }
                numItems = Number(numItems);

                // Determine the number of digits in each item
                var digits = tokens.shift();

                for(var i = 0; i < numItems; i++){
                    var val = [];
                    for(var j = 0; j < digits; j++){
                        val.push(tokens.shift());
                    }
                    arr.push(Number(val.join("")));
                }

                arrSet.push(arr);
            }

            return arrSet;
        };
        
        /**
         * Minimizes the given structure using simple integer reduction technique to 
         * make a smaller string for later compression
         * 
         * @param {Object} ob - object to minimize
         * @return {Object} - minimized version
         */
        minimize(ob){
            var thisClass = this;
            return{
                attr: ob.attr,
                nodes: ob.nodes.map(function(set){
                    return [
                        thisClass.minimizeNumericArray(set.attr),
                        thisClass.minimizeNumericArray(set.nodes)
                    ].join("");
                })
            };
        };

        
    
        /**
         * Minimizes a numeric (integer) array
         * 
         * @param {number[]} arr - array of integers
         * @return {String} - a minimized string 
         */
        minimizeNumericArray(arr){
            if(arr.length === 0){
                return "";
            }else{
                var buckets = arr.reduce(function(acc, n){
                    var str = ""+n;
                    var len = str.length;
                    if(!acc.hasOwnProperty(len)){
                        acc[len] = [];
                    }
                    acc[len].push(n);
                    return acc;
                }, {});



                buckets = Object.keys(buckets).map(function(b){
                    var numItems = buckets[b].length;
                    var strlenNum = (""+numItems).length;
                    return [strlenNum, numItems, b, buckets[b].join("")].join("");
                });

                return buckets.join("");
            }
        };
        
        shatter(combined){
            var thisClass = this;
            var attrVals = combined.attr;
            var shadows = combined.nodes;
            
            var nodes = shadows.map(function(set){                
                var nodes = set.nodes.map(function(d){
                    var node = {
                        id: d,
                        nodeid: d
                    };
                    set.attr.forEach(function(v,i){
                        node[attrVals[i].name] = v;
                    });
                    return node;
                });
                return nodes;
            }).reduce(function(acc,val){
                return acc.concat(val);
            }, []);
            
            return {
                nodes: nodes,
                attr: attrVals.reduce(function(acc, val){
                    acc[val.name] = val.vals;
                    return acc;
                }, {})
            };
        }
        
        
        /**
         * Splits the nodes into groups based on their attributes. This version splits
         * based on the order of the given attributes.
         * 
         * @param {Backbone.Model} nodes
         * @param {string[]} attributes - an ORDERED list of attributes
         * @return {Object[]} - objects containing sets of nodes each of which has associated attributes
         */
        splitOnFirst(nodes, attributes){
            var thisClass = this;
            if(nodes.length === 0 || attributes.length === 0){
                return [{
                    nodes: nodes.map(function(n){
                        return n.nodeid;
                    })
                }];
            }else{
                var buckets = {};

                // Determine which attribute to split on
                var splitAttr = attributes[0];

                // Examine each node
                nodes.forEach(function(node){
                    // Determine the node's value for the attribute 
                    var nodeValue = node[splitAttr];

                    // If there is no bucket with that value then add one
                    if(!buckets.hasOwnProperty(nodeValue)){
                        buckets[nodeValue] = [];
                    }

                    // Add node to correct bucket
                    buckets[nodeValue].push(node);
                });

                // Remove the first attribute by filtering it out
                var newAttributes = attributes.filter(function(d,i){
                    return i > 0;
                });


                var division = [];
                Object.keys(buckets).forEach(function(d){
                    // Split each bucket recursively
                    var classified = thisClass.splitOnFirst(buckets[d], newAttributes);

                    // Apply the current value to the nodes
                    classified.forEach(function(c){
                        c[splitAttr] = d;

                        // Convert to array
                        division.push(c);
                    });
                });

                // Return divided sets
                return division;
            }
        };
    }
    
    return GraphCompressor;
});


