/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

define(["hub-lib", "search-engine-lib"], function(Hub, SearchEngine){
    class Ranker{
        constructor(main){
            var thisClass = this;
            thisClass._main = main;
        }
        
        rank(results){
            var thisClass = this;
            
            // Ensure that we are only dealing with one object at a time
            if($.isArray(results)){
                return results.map(function(d){
                    return thisClass.rank(d);
                });
            }
            
            /**
             * The search term used to generat the results
             * @type {string}  
             */
            var term = results.term.value;
            
            /**
             * List of all standard models that contained matching strings to the term.
             * @type {RemoteModel[]}
             */
            var matchingStandards = Hub.getModels("simplestandard", results.standard.matches);
            
            /**
             * The text ids of all matching standards
             * @type {string[]}
             */
            var standardTextIDs = matchingStandards.map(function(d){
                return Hub.stripHtml(d.get("textid"));
            });
            
            // Create a regular expression to perform exact matches instead of the 
            // fuzzy match used to get the initial results.
            var exactTextIDs = thisClass._main.exactSearch(standardTextIDs, term.toLowerCase());
            if(standardTextIDs.length > 0 && exactTextIDs.length === 0){
                // Don't use exact
                exactTextIDs = standardTextIDs;
            }
            
            /**
             * Perform a subsearch for each sub-standard
             * @type {object[]}
             */
            var standardSubSearch = exactTextIDs.map(function(d){
                return SearchEngine.search({
                    value: d
                });
            });
            
            // Need one map per standard. If no map exists then request a dynamic
            // map instead.
            var dynamic = [];
            var maps = [];
            
            standardSubSearch.forEach(function(d){
                assert(d.length === 1);
                
                var subsearch = d[0];
                
                // Force map titles to match the subsearch term
                var subsearchMaps = subsearch.map.matches.filter(function(mapid){
                    var title = Hub.stripHtml(Hub.get("map").get(mapid).get("title"));
                    if(title === "RL.2.2"){
                        var k =0;
                    }
                    
                    return thisClass._main.exactSearch([title], subsearch.term.value.toLowerCase()).length > 0;
                });
                
                // No map so request a dynamic map.
                if(subsearchMaps.length === 0){
                    subsearch.term.value = subsearch.term.value.toUpperCase();
                    dynamic.push({
                        name: subsearch.term,
                        nodes: subsearch.node.matches
                    });
                }
                
                // Map exists so add it to the list of maps to display in response
                else{
                    maps.push(subsearchMaps);
                }
            });
            
            // Flatten to a single list and remove the duplicates
            maps = maps.reduce(function(acc, val){
                return acc.concat(val);
            }, []);
            removeDuplicates(maps);
            
            // Send back results as simply as possible
            return {
                standard: term,
                dynamic: dynamic,
                maps: maps
            };
        }
    }
    
    return Ranker;
});


