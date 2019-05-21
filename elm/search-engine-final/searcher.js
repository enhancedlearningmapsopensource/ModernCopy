define(["fuzzysearch"], function(FuzzySearch){
    // Construct the search set    
    class Searcher{
        
        buildSearchSet(table){
            throw Error("Child must implement");    
        }
        
        defineSets(searchOb){
            throw Error("Child must implement");
        }
        
        defineSubjects(searchOb){
            throw Error("Child must implement");
        }
        
        search(term, timing){
            var thisClass = this;
            timing.start("search ([" + thisClass.type() + "::searcher].search()," + term.value + ")");
            
            var searchSet = thisClass.searchSet();
            if(searchSet === null){
                timing.start("build search set ([" + thisClass.type() + "::searcher].search()," + term.value + ")");
                thisClass.buildSearchSet(thisClass.type(), timing);
                searchSet = thisClass.searchSet();
                timing.stop("build search set ([" + thisClass.type() + "::searcher].search()," + term.value + ")");
            }
            
            
            var start = timeNow();
            var resultSet = searchSet.items;
            
            // Perform fuzzy search
            timing.start("fuzzy search ([" + thisClass.type() + "::searcher].search()," + term.value + ")");
            resultSet = resultSet.filter(function(s){
                return FuzzySearch(term.value, s.broad);
            });
            timing.stop("fuzzy search ([" + thisClass.type() + "::searcher].search()," + term.value + ")");
            
            // Apply Subject Filter
            timing.start("filter by subject ([" + thisClass.type() + "::searcher].search()," + term.value + ")");
            if(term.hasOwnProperty("subject")){
                timing["[" + thisClass.type() + "::searcher].search() => Total defineSubjects (" + term.value + ")"] = 0;
                resultSet = resultSet.filter(function(d){
                    if(!d.hasOwnProperty("subject")){
                        var t = timeNow();
                        thisClass.defineSubjects(d, timing);
                        timing["[" + thisClass.type() + "::searcher].search() => Total defineSubjects (" + term.value + ")"] =
                                Number(timing["[" + thisClass.type() + "::searcher].search() => Total defineSubjects (" + term.value + ")"]) + Number(timeNow() - t);
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
            timing.stop("filter by subject ([" + thisClass.type() + "::searcher].search()," + term.value + ")");
            
            // Apply Set Filter
            timing.start("filter by set ([" + thisClass.type() + "::searcher].search()," + term.value + ")");
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
            timing.stop("filter by set ([" + thisClass.type() + "::searcher].search()," + term.value + ")");
            
            var matchSet = resultSet.map(function(d){
                return d.id;
            });
            
            var time = timeNow() - start;
            timing.stop("search ([" + thisClass.type() + "::searcher].search()," + term.value + ")");
            
            return {
                matches: matchSet,
                time: time
            };
        }
        
        searchSet(){
            throw Error("Child must implement");
        }
        
        type(){
            throw Error("Child must implement");   
        }
    }
    
    
    return Searcher;
});



