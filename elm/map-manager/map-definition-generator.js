define(["backbone",
        "activeGraph",
        "hub-lib"], 
function(Backbone,
         ActiveGraph,
         Hub){
    var pvt = {};         
    var View = Backbone.View.extend({        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {};
            
            /*var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);*/
        },
        
        
        /**
         * Convert the active graph to a map definition
         * @return {Promise(mapDef)} - the map definition
         */
        getMapDefinitionForActiveSubgraph: function(){            
            /// Create object to pass to server
            var mapDef = {};
            
            /// Get node information
            mapDef.nodes = [];

            var visibleNodes = ActiveGraph.getNodes(appstate);
            var coloredNodes = ActiveGraph.getNodeColor(appstate, visibleNodes);
            coloredNodes.forEach(function (n) {
                var color = n.color;
                switch(color){
                    case "gray": color = 0; break;
                    case "red": color = 1; break;   
                    case "blue": color = 2; break;
                    default: throw Error("unknown color: " + color);
                }
                mapDef.nodes.push({ id: n.node, color: color });
            });

            /// Get the current map id
            mapDef.mapID = ActiveGraph.getGraphID(appstate);

            /// Get form information
            if(typeof mapDef.mapID === 'number'){
                var serverModel = Hub.get("map").get(mapDef.mapID);
                mapDef.mapName = Hub.stripHtml(serverModel.get("title"));
                mapDef.mapDesc = Hub.stripHtml(serverModel.get("description"));
            }
            
            mapDef.isPublic = false;
            return mapDef;
        },
        
        /**
         * Get the map definition by merging a saved subgraph with the given graph state
         * @return {object} - a map definition
         */
        getMapDefinitionForSavedSubgraph: function(map){
            /// Create object to pass to server
            var mapDef = {nodes:[]};
            mapDef.nodes = Hub.wrap(map).getNodeColorMap();

            /// Get the current map id
            mapDef.mapID = map.id;

            // Get form information
            mapDef.mapName = Hub.stripHtml(map.get("title"));
            mapDef.mapDesc = Hub.stripHtml(map.get("description"));
            mapDef.isPublic = (map.get("isPublic") === null) ? false : (map.get("isPublic") === 1 ? true : false);
            
            // Get resources associated with the map
            mapDef.mapResources = pvt.getResourceIDs(map.id);

            return mapDef;
        }
    });
    
    /**
     * Get maps associated with the resource AND visible to the user
     * @return {Backbone.Model[]} - maps associated with the resource AND visible to the user
     */
    pvt.getResourceIDs = function(mapid){        
        // Get maps associated with resource
        var resMaps = Hub.get("mapresource").where({mapid: mapid}).filter(function(record){
            return Hub.get("resource").has(record.get("resourceid"));
        }).map(function(record){
            return Hub.get("resource").get(record.get("resourceid"));
        });

        // Filter resources visible to user
        return resMaps.filter(function(resource){
            return (resource.get("ispublic") === 1 || resource.get("creatorid") === userID);
        });
    };
    
    var singleton = new View();
    return singleton;
});
