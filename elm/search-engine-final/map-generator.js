/* 
 * Generates maps from standards. Creates the new map in the data so that its faster the next time but does not 
 * upload the map to the server. 
 */

define(["hub-lib"], function(Hub){
    class Generator{
        constructor(){
            var thisClass = this;
            thisClass.standardToMapID = {};
        }
        
        reset(){
            var thisClass = this;
            thisClass.standardToMapID = {};
        }
        
        /**
         * Generates the map for the given standard
         * @param {string} textid - the textid of the standard used to generate the map
         * @return {string} - the id of the map
         */
        generateMap(textid){
            var thisClass = this;
            
            // Check cache
            if(thisClass.standardToMapID.hasOwnProperty(textid)){
                return thisClass.standardToMapID[textid];
            }
            
            // Get standard
            var standard = thisClass.getStandard(textid);
            
            // Create the map
            var mapID = (-1)*Hub.get("map").length;
            Hub.get("map").add({
                id: mapID,
                title: textid
            });
            
            assertExists(Hub.get("map").get(mapID));
            
            // Get standard nodes
            var nodeIDs = Hub.wrap(standard).nodeIDs();
            
            // Add nodes to map
            var mapNodes = Hub.get("mapnode");
            nodeIDs.forEach(function(nid){
                mapNodes.add({
                    mapid: mapID,
                    nodeid: nid,
                    color: 1
                });
            });
            
            // Save map
            thisClass.standardToMapID[textid] = mapID;
            return mapID;
            
        }
        
        /**
         * Generates one map for each given standard
         * @param {string[]} textids - the textids of the standard used to generate the map
         * @return {number[]} - the ids of the maps
         */
        generateMaps(textids){
            var thisClass = this;
            
            // Check cache
            var cachedResults = [];
            var newMaps = [];
            var rollingID = Hub.get("map").length;
            
            textids.forEach(function(d){
                var c = {
                    cached: null,
                    textid: d,
                    mapid: null
                };
                
                if(thisClass.standardToMapID.hasOwnProperty(d)){
                    c.cached = true;
                    c.mapid = thisClass.standardToMapID[d];
                }else{
                    c.cached = false;
                    c.standard = thisClass.getStandard(d);
                    c.mapid = (-1)*(rollingID++),
                    newMaps.push({
                        id: c.mapid,
                        mapid: c.mapid,
                        title: d
                    });
                }
                
                cachedResults.push(c);
            });
            
            // Create the maps
            if(newMaps.length > 0){
                Hub.get("map").add(newMaps);
                
                // Save the mapping
                newMaps.forEach(function(d){
                    assert(Hub.get("map").get(d.mapid).get("title") === d.title);
                    thisClass.standardToMapID[d.title] = d.mapid;
                });
                
                // Find nodes
                var newMapNodes = [];
                cachedResults.forEach(function(c){
                    if(!c.cached){
                        var nodeIDs = Hub.wrap(c.standard).nodeIDs();
                        nodeIDs.forEach(function(nid){
                            newMapNodes.push({
                                mapid: c.mapid,
                                nodeid: nid,
                                color: 1
                            });
                        });
                    }
                });
                
                // Add mapnodes
                Hub.get("mapnode").add(newMapNodes);
            }
            
            return cachedResults.map(function(d){
                return d.mapid;
            });
        }
        
        /**
         * Gets the standard with the given textid
         * @param {string} textid
         * @return {RemoteModel}
         */
        getStandard(textid){
            var standardCol = Hub.get("simplestandard");
            
            // Find standards with matching textid
            var standardMatches = standardCol.filter(function(s){
                return Hub.stripHtml(s.get("textid")).trim() === textid;
            });
            
            // Try lower case match
            if(standardMatches.length === 0){
                var lowerTextID = textid.toLowerCase();
                var standardMatches = standardCol.filter(function(s){
                    return Hub.stripHtml(s.get("textid")).toLowerCase() === lowerTextID;
                });
            }
            
            if(standardMatches.length === 0){
                throw Error("Cannot find standard: " + textid);
            }else if(standardMatches.length > 1){
                throw Error("To many matches for standard: " + textid);
            }
            return standardMatches[0];
        }
    }
    
    var singleton = new Generator();
    return singleton;
});


