define(["./searcher", "./node-searcher", "hub-lib", "fuzzysearch"], function(Searcher, NodeSearcher, Hub, FuzzySearch){
    // Construct the search set
    var searchSet = null;
    
    class MapSearcher extends Searcher{
        
        buildSearchSet(table){
            searchSet = {
                _byid: {}
            };
            searchSet.items = Hub.get(table).filter(function(d){
                return (d.get("datedeleted") === null || d.get("datedeleted") === TIME_ZERO || d.get("datedeleted") === "0000-00-00 00:00:00");
            }).map(function(d, i){
                //var wrapped = Hub.wrap(d);
                searchSet._byid[d.id] = i;
                return {
                    id: d.id,
                    broad: [
                        Hub.stripHtml(d.get("title")).trim(),
                        d.has("description") ? Hub.stripHtml(d.get("description")).trim() : ""
                    ].join(" ").toLowerCase(),
                    //nodeIDs: wrapped.nodeIDs()
                };
            });     
        }
        
        defineSets(searchOb){
            var thisClass = this;
            
            if(!searchOb.hasOwnProperty("subject")){
                thisClass.defineSubjects(searchOb);
            }
            
            var subjects = searchOb.subject;
            var sets = Hub.getModels("subject", subjects).map(function(d){
                return d.get("setid");
            });
            removeDuplicates(sets);
            
            searchOb.set = sets;
            assertDefined(searchOb.set);
        }
        
        defineSubjects(searchOb, timing){
            var thisClass = this;
            
            var nodeIDs = Hub.wrap(Hub.get("map").get(searchOb.id)).nodeIDs();
            
            // Filter out nodes that are not in the NodeSearcher
            var searcherNodes = nodeIDs.map(function(d){
                var node = NodeSearcher.searchSet().items[NodeSearcher.searchSet()._byid[d]];
                if (typeof node === "undefined" || node === null){
                    return null;
                }else{
                    return node;
                }
            }).filter(function(d){
                return d !== null;
            });
            
            // Ensure that all nodes have a subject then compile subjects to list
            var subjects = searcherNodes.map(function(node){                
                if(!node.hasOwnProperty("subject")){
                    NodeSearcher.defineSubjects(node, timing);
                }
                return node.subject;
            });
                    
            subjects = (subjects.length > 0) ? subjects.reduce(function(acc,val){
                return acc.concat(val);
            }) : subjects;
            
            removeDuplicates(subjects);
            searchOb.subject = subjects;
        }
        
        /*search(term){
            var thisClass = this;
            if(searchSet === null){
                thisClass.buildSearchSet("map");
            }
            
            var d = new Date();
            var start = d.getTime();
            
            var resultSet = searchSet.items;
            
            // Apply Set Filter
            if(term.hasOwnProperty("set")){
                resultSet = resultSet.filter(function(d){
                    if(!d.hasOwnProperty("set")){
                        thisClass.defineSets(d);
                    }
                    
                    // If there are no sets associated to the node then keep
                    if(d.set.length === 0){
                        return true;
                    }
                    
                    // Filter out other sets
                    for(var i = 0; i < d.set.length; i++){
                        for(var j = 0; j < term.set; j++){
                            if(d.set[i] === term.set[j]){
                                return true;
                            }
                        }
                    }
                    return false;
                });
            }
            
            // Apply Subject Filter
            if(term.hasOwnProperty("subject")){
                resultSet = resultSet.filter(function(d){
                    if(!d.hasOwnProperty("subject")){
                        thisClass.defineSubjects(d);
                    }
                    
                    // If there are no subjects associated to the node then keep
                    if(d.subject.length === 0){
                        return true;
                    }
                    
                    // Filter out other subjects
                    for(var i = 0; i < d.subject.length; i++){
                        for(var j = 0; j < term.subject; j++){
                            if(d.subject[i] === term.subject[j]){
                                return true;
                            }
                        }
                    }
                    return false;
                });
            }
            
            resultSet = resultSet.filter(function(s){
                return FuzzySearch(term.value, s.broad);
            });
            
            d = new Date();
            var time = d.getTime() - start;
            
            return {
                matches: resultSet.map(function(d){
                    return d.id;
                }),
                time: time
            };
        }*/
        
        reset(){
            searchSet = null;
        }
        
        searchSet(){
            /*var thisClass = this;
            if(searchSet === null){
                thisClass.buildSearchSet("map");
            }*/
            return searchSet;
        }
        
        type(){
            return "map";
        }
    };
    
    
    var singleton = new MapSearcher();
    return singleton;
});



