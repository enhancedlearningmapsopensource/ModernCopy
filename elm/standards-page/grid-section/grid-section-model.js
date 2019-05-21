define(["backbone", "../grid-tile/grid-tile-collection", "hub-lib"], 
function(Backbone, TileCollection, Hub){
             
    var pvt = {};         
    var Model = Backbone.Model.extend({
        countNonElmMaps: function(){
            var thisModel = this;
            return thisModel.get("tiles").reduce(function(acc, val){
                if(val.get("visible") === false){
                    return acc;
                }else{
                    return acc + val.countNonElmMaps();
                }
            }, 0);
        },
        
        countNonResourceMaps: function(){
            var thisModel = this;
            return thisModel.get("tiles").reduce(function(acc, val){
                if(val.get("visible") === false){
                    return acc;
                }else{
                    return acc + val.countNonResourceMaps();
                }
            }, 0);
        },
        
        hasElmMaps: function(){
            var thisModel = this;
            var tiles = thisModel.get("tiles");
            for(var i = 0; i < tiles.length; i++){
                if(tiles.at(i).hasElmMap()){
                    return true;
                }
            }
            return false;
        },
        
        hasResMaps: function(){
            var thisModel = this;
            var tiles = thisModel.get("tiles");
            for(var i = 0; i < tiles.length; i++){
                if(tiles.at(i).hasResMap()){
                    return true;
                }
            }
            return false;
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisModel = this;
            thisModel.set({
                "tiles": new TileCollection(),
                "visible": false
            });
        },
        
        /**
         * Render the view
         */
        parse:function(data){
            var thisModel = this;
        },
        
        setResults: function(results){
            var thisModel = this;
            
            // Hide all tiles
            thisModel.get("tiles").forEach(function(d){
                return d.set("visible", false);
            });
            if(results === null){
                return;
            }
            
            if(results.maps.length > 0){
                results.maps.forEach(function(d){
                    pvt.addResultMap.call(thisModel, d);
                });
            }
            if(results.dynamic.length > 0){
                var maps = results.dynamic.map(function(d){
                    return Hub.get("map").findWhere({title: d.name.value}, Hub);
                });
                maps.forEach(function(d){
                    pvt.addResultMap.call(thisModel, d.id);
                });
            }
        }
    });
    
    pvt.addResultMap = function(mapid){
        var thisModel = this;
        var tiles = thisModel.get("tiles");
        if(!tiles.has(mapid)){
            var map = Hub.get("map").get(mapid);
            tiles.add({
                id: mapid,
                hubmodel: map
            });
        }
        tiles.get(mapid).set("visible", true);
    };
    
    return Model;
});
