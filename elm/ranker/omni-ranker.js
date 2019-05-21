define(["hub-lib", 
        //"search-engine-lib",
        "jsclass!external-lib/jsclass/", 
        "./match-scorer"], 
function(Hub, 
         //SearchEngine,
         JsClass, 
         Scorer){
             
    var pvt = {};
    
    class Ranker{
        constructor(main){
            var thisClass = this;
            thisClass._main = main;
            thisClass._scorer = new Scorer();
            //thisClass._nodemap = new NodeMapTable();
        }
        
        rank(results, term){
            var ranktimes = [];
            var rankstart = timeNow();
            var halfastart = timeNow();
            var thisClass = this;
            
            // Ensure that we are only dealing with one object at a time
            if($.isArray(results)){
                return pvt.merge.call(thisClass, results.map(function(d){
                    return thisClass.rank(d);
                }), term);
            }
            
            /**
             * The search term used to generate the results
             * @type {string}  
             */
            var term = pvt.escapeRegExp(results.term.value);
            
            
            /**
             * Verify nodes using an exact match.
             * @type {number[]}
             */
            var reg = new RegExp(".*" + term.toLowerCase().replaceAll(".","\\\.") + ".*", 'i');
            var exactNodes = Hub.getModels("node",results.node.matches).filter(function(d){
                // Construct search string
                var joined = [
                    Hub.stripHtml(d.get("title")),
                    Hub.stripHtml(d.get("shorttitle")),
                    Hub.stripHtml(d.get("textid"))
                ].join("|");
                
                if(Hub.stripHtml(d.get("textid")) === "M-238"){
                    var k = 0;
                }
                
                var searchString = joined.toLowerCase();//pvt.escapeRegExp(joined.toLowerCase());
                
                // Test search string
                return reg.test(searchString);
            }).map(function(d){
                return d.id;
            });
            
            /**
             * Verify standards using an exact match.
             * @type {RemoteModel}
             */
            var exactStandard = Hub.getModels("simplestandard",results.standard.matches).filter(function(d){
                // Construct search string
                var searchString = [
                    Hub.stripHtml(d.get("textid"))
                ].join("|");
                
                // Test search string
                return reg.test(pvt.escapeRegExp(searchString));
            });
            
            /**
             * Verify maps using an exact match. While we have the maps also get the total nodes per map.
             * @type {number[]}
             */
            var scoresPerMap = {};
            var validMapIDs = results.map.matches.filter(function(d){
                return d > 0;
            });
            
            var exactMap = Hub.getModels("map",validMapIDs).filter(function(d){
                var fields = [
                    Hub.stripHtml(d.get("title")),
                    Hub.stripHtml(d.get("description"))
                ];
                
                // Construct search string
                var searchString = fields.join("|");
                if(reg.test(searchString)){
                    scoresPerMap[d.id] = thisClass._scorer.score(term, d.id, fields) + 1;
                    return true;
                }else{
                    return false;
                }
            }).map(function(d){
                return d.id;
            });
            ranktimes.push({"halfa": timeNow() - halfastart});
            var halfbstart = timeNow();
            
            /**
             * Get nodes attached to matching standards
             * @type {number[]}
             */
            var standardnodestart = timeNow();
            var standardNodes = exactStandard.map(function(standard){
                return Hub.wrap(standard).nodeIDs();
            }).reduce(function(acc, val){
                return acc.concat(val);
            }, []);
            ranktimes.push({"standardnode": timeNow() - standardnodestart});
            
            /**
             * Merge the two node sets
             * @type {number[]}
             */
            var nodes = (new JsClass.Set(exactNodes)).union(new JsClass.Set(standardNodes));
            
            /**
             * Get maps attached to nodes and record how many matched nodes are in each map
             * @type {number}
             */
            var nodemapstart = timeNow();
            var nodeMatchesPerMap = {};
            var nodeCollection = Hub.get("node");
            //var nodemap = thisClass._nodemap.model.get("nodetomap");
            
            var nodeMaps = nodes.map(function(nodeid){
                var mapIDs = Hub.search("nodemap", nodeid);
                
                if(mapIDs.count > 0){
                    var nmaps = mapIDs;
                    nmaps.forEach(function(mapid){
                        if(!nodeMatchesPerMap.hasOwnProperty(mapid)){
                            nodeMatchesPerMap[mapid] = 0;
                        }
                        nodeMatchesPerMap[mapid]++;
                    });
                }
                return mapIDs;
            }).reduce(function(acc, val){
                return acc.concat(val);
            }, []).filter(function(d){
                return d > 0;
            });
            ranktimes.push({"nodemap": timeNow() - nodemapstart});
            
            /**
             * Merge the map sets
             * @type {type}
             */
            var maps = (new JsClass.Set(exactMap)).union(new JsClass.Set(nodeMaps));
            
            ranktimes.push({"halfb": timeNow() - halfbstart});
            ranktimes.push({"totalrank": timeNow() - rankstart});
            
            // Uncomment to display the times in the console
            // ===========================================
            /*console.log(ranktimes.map(function(d){
                var t = Object.keys(d)[0];
                return t + ": " + d[t];
            }).join("\n"));*/
            // ===========================================
            
            /**
             * Format for output
             * @type {type}
             */
            return {
                term: term,
                nodespermap: {
                    match: nodeMatchesPerMap
                },
                mapids: maps,
                nodes: nodes,
                scores: scoresPerMap
            };
        }
    }
    
    /**
     * Escape characters that break the regular expression
     * @param {type} str
     * @return {string} - the escaped (clean) string
     * @source: https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
     */
    pvt.escapeRegExp = function(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    };
    
    pvt.merge = function(omniresults, term){
        var thisClass = this;
        
        // Get all maps in all results
        var allmaps = omniresults.reduce(function(acc, val){
            return acc.union(val.mapids);
        }, new JsClass.Set());
        
        // "(AVERAGE_MATCH_SCORE  + AVERAGE_NODE_SCORE)/2.0"
        // MATCH_SCORE(term) = 1 if it matches, 0 otherwise
        // AVERAGE = MATCH_SCORE(termi...)/NUM_TERMS
        
        // "(AVERAGE_MATCH_SCORE + AVERAGE_STANDARD_SCORE)/2.0"
        
        // Score the maps
        var mapScores = allmaps.map(function(mapid){
            var aveMatchScore = omniresults.reduce(function(acc, val){
                if(val.scores.hasOwnProperty(mapid)){
                    return acc + val.scores[mapid];
                }else{
                    return acc;
                }
            }, 0)/omniresults.length;
            
            // Get total number of nodes
            var aveNodeScore = 0;
            var map = Hub.get("map").get(mapid);
            var wrappedMap = (typeof map !== "undefined" && map !== null) ? Hub.wrap(map) : null;
            var totalNodes = wrappedMap !== null ? wrappedMap.nodeIDs().length : 0;
            if(totalNodes > 0){
                var nodeMatches = omniresults.map(function(res){
                    if(res.nodespermap.match.hasOwnProperty(mapid)){
                        return res.nodespermap.match[mapid];
                    }
                    return 0;
                });

                var nodeScores = nodeMatches.map(function(d){
                    return d/totalNodes;
                });

                aveNodeScore = nodeScores.reduce(function(acc,val){
                    return acc + val;
                }, 0)/omniresults.length;
            }
            
            return {
                id: mapid,
                score: (aveNodeScore + aveMatchScore)/2
            };
        });
        
        mapScores.sort(function(a,b){
            return (b.score - a.score);
        });
        
        return {
            nodes: {
                all: omniresults.reduce(function(acc, val){
                    return (acc === null) ? val.nodes : acc.intersection(val.nodes);
                }, null),
                any: omniresults.reduce(function(acc, val){
                    return acc.union(val.nodes);
                }, new JsClass.Set())
            },
            maps: mapScores.map(function(d){
                return d.id;
            }),
            term: term
        };
    };
    
    /**
     * Get scorable fields
     * @param {number} mapid
     * @return {string[]}
     */
    pvt.scorableFields = function(mapid){
        var model = Hub.get("map").get(mapid);
        return [
            Hub.stripHtml(model.get("title")),
            Hub.stripHtml(model.get("description"))
        ];
    };
    
    return Ranker;
});


