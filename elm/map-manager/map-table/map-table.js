define(["backbone",
        "mustache",
        "text!./map-table.html",
        "hub-lib",
        "../map-table-row/map-table-row"], 
function(Backbone,
         Mustache,
         Template,
         Hub,
         MapTableRow){
             
    var pvt = {};         
    var View = Backbone.View.extend({     
        template: Template,
        events: {},
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Mustache.parse(thisView.template);
            
            thisView.model.set("maprows", new Backbone.Collection());
            thisView.model.set("editmap", null);
            
            thisView.listenTo(Hub.get("map"), "update", pvt.updateMaps);
            thisView.listenTo(Hub.get("map"), "reset", pvt.updateMaps);
            thisView.listenTo(thisView.model.get("maprows"), "update", thisView.render);
            thisView.listenTo(thisView.model.get("maprows"), "change:edit", pvt.editMap);
            thisView.listenTo(thisView.model.get("maprows"), "change:upload", pvt.uploadMap);
            thisView.listenTo(appstate, "change:showdeletedmaps", thisView.render);
            thisView.listenTo(appstate, "change:maptablefilter", thisView.render);
            thisView.listenTo(Hub.get("map"), "change:datedeleted", thisView.render);
            thisView.listenTo(Hub.get("mapresource"), "change", thisView.render);
            thisView.listenTo(Hub.get("mapresource"), "update", thisView.render);

            pvt.updateMaps.call(thisView, Hub.get("map"));
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {};
            
            var showdeletedmaps = appstate.get("showdeletedmaps");
            var maprows = thisView.model.get("maprows").map(function(d){return d;});
            
            if(!showdeletedmaps){
                // Filter out deleted maps
                maprows = maprows.filter(function(d){
                    return (!d.get("view").isDeleted());
                });
            }
            
            // Filter maps by search term
            maprows = pvt.filterMaps(maprows);
            
            // Sort remaining rows
            pvt.sortMaps(maprows);
            
            // Detach all maprows
            thisView.model.get("maprows").forEach(function(row){
                row.get("view").$el.detach();
            });
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            // Attach filtered & sorted maprows
            var $table = thisView.$el.find("#tbody");
            maprows.forEach(function(row){
                $table.append(row.get("view").$el);
            });
            
            thisView.$el.find('[data-toggle="tooltip"]').each(function(e){
                $(this).tooltip();
            });
        }
    });
    
    pvt.filterMaps = function(maps){
        var filter = appstate.get("maptablefilter").trim();
        if(filter.length === 0){
            return maps;
        }
        
        // Define search expression
        var reg = new RegExp(".*" + filter + ".*", 'i');
        
        // Find non-matching maps
        return maps.filter(function(d){
            return reg.test(d.get("view").searchTerm());
        });
    };
    
    pvt.editMap = function(model, value){
        var thisView = this;
        if(value === true){
            thisView.model.set("editmap", model.get("servermodel"));
            thisView.model.set("editmap", null);
        }
    };
    
    pvt.uploadMap = function(model, value){
        var thisView = this;
        if(value === true){
            thisView.model.set("uploadmap", model.get("servermodel"));
            thisView.model.set("uploadmap", null);
        }
    };
    
    pvt.updateMaps = function(collection){
        var thisView = this;
        var maps = Hub.get("map");
        var maprows = thisView.model.get("maprows");
        
        // Get maps belonging to user.
        var myMaps = maps.filter(function(map){
            return (map.get("creatorid") === userID);
        });
        
        // Get maps not in maprows
        var newMaps = myMaps.filter(function(map){
            return (!maprows.has(map.id));
        });
        
        
        var newMapModels = newMaps.map(function(map){
            var newMapModel = new Backbone.Model({
                id: map.id,
                servermodel: map
            });
            newMapModel.set("view", new MapTableRow({
                id: "map-table-row-view-" + map.id,
                model: newMapModel
            }));
            newMapModel.get("view").render();
            return newMapModel;
        });
        maprows.add(newMapModels);
    };
    
    pvt.sortMaps = function(maps){
        // Sort by date (newest first)
        maps.sort(function(a,b){
            return b.get("view").dayStamp()-a.get("view").dayStamp();
        });
    };
    
    
    return View;
});