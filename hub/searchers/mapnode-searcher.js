/* 
 * Optimized searcher for map-node relationships
 */
define(["./base-searcher", "../main"], function(BaseSearcher, Hub){
    var Searcher = BaseSearcher.extend({
        initialize: function(){
            var thisModel = this;
            thisModel.listenTo(Hub.get("mapnode"), "update", thisModel.update);
            thisModel.update();
            
        },
        
        search: function(id){
            var thisModel = this;
            assertType(id, "number");
            var map = thisModel.get("map");
            
            var keyMatch = thisModel.binarySearch(map, 0, map.length - 1, id);
            if(keyMatch === -1){
                return [];
            }
            
            var result = [map[keyMatch].value];
            var keyUp = keyMatch - 1;
            while(keyUp >= 0 && map[keyUp].key === id){
                result.push(map[keyUp].value);
                keyUp--;
            }
            
            var keyDown = keyMatch + 1;
            while(keyDown < map.length && map[keyDown].key === id){
                result.push(map[keyDown].value);
                keyDown++;
            }
            return result;
        },
        
        update: function(){
            var thisModel = this;
            var map = [];
            var start = timeNow();
            Hub.get("mapnode").forEach(function(d){
                map.push({key: d.get("mapid"), value: d.get("nodeid")});
            });
            map.sort(function(a,b){
                return a.key - b.key;
            });
            thisModel.set("map", map);
            
            var cost = timeNow() - start;
            if(cost > 1000){
                console.warn("Cost to update mapnode searcher: " + cost + " ms");
            }
        }
    });
    
    return function(name, id){ return BaseSearcher.searchTable(name, id, Searcher); }
});


