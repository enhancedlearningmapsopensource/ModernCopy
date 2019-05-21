define(["core",
        "mustache",
        "text!./grid-section.html",
        "hub-lib",
        "../grid-tile/grid-tile"], 
function(Core,
         Mustache,
         Template,
         Hub,
         Tile){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {},
        
        /**
         * Initialize the view
         */
        initialize: function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            thisView.listenTo(thisView.model.get("tiles"), "add", pvt.tileAdded);
            thisView.listenTo(thisView.model.get("tiles"), "change:visible", pvt.tileVisibilityChanged);
            thisView.listenTo(thisView.model.get("tiles"), "change:filtered", pvt.tileVisibilityChanged);
        },
        
        /**
         * Render the view
         */
        render: function(){
            var thisView = this;
            var renderOb = {
                title: Hub.stripHtml(thisView.model.get("title"))
            };
            
            var tiles = thisView.detachGroup("tile-views");
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            // Get visible tiles
            
            tiles = pvt.getVisibleTileViews.call(thisView);
                    
                    //tiles.filter(function(d){
                //return (d.model.get("visible") === true && d.model.get("filtered") === false && (!d.model.get("hubmodel").has("datedeleted") || d.model.get("hubmodel").get("datedeleted") === null));
            //});
            
            // Sort tiles alphabetically
            tiles.sort(function(a,b){
                return Hub.stripHtml(a.model.get("hubmodel").get("title")).localeCompare(Hub.stripHtml(b.model.get("hubmodel").get("title")));
            });
            
            tiles.forEach(function(d){
                thisView.$el.append(d.$el);
            });
            
            thisView.$el.find('[data-toggle="tooltip"]').each(function(e){
                $(this).tooltip();
            });
        },
        
        postattach: function(){
            var thisView = this;
            var tiles = pvt.getVisibleTileViews.call(thisView);
            tiles.forEach(function(d){
                d.postattach();
            });
        }
    });
    
    pvt.getVisibleTileViews = function(){
        var thisView = this;
        var visibleTileViews = [];
        thisView.forEachInGroup("tile-views", function(d){
            if(d.model.get("visible") === true && d.model.get("filtered") === false && 
                    (!d.model.get("hubmodel").has("datedeleted") || 
                      d.model.get("hubmodel").get("datedeleted") === null ||
                      d.model.get("hubmodel").get("datedeleted") === TIME_ZERO || 
                      d.model.get("hubmodel").get("datedeleted") === "0000-00-00 00:00:00")){
                visibleTileViews.push(d);
            }
        });
        return visibleTileViews;
    };
    
    pvt.tileAdded = function(model){
        var thisView = this;
        thisView.addToGroup("tile-views", new Tile({
            id: model.id,
            model: model
        }), model.id).render();
        thisView.render();
    };
    
    pvt.tileVisibilityChanged = function(model){
        var thisView = this;
        var anyTileVisible = thisView.model.get("tiles").reduce(function(acc, val){
            return acc || (val.get("visible") === true && val.get("filtered") === false);
        }, false);
        thisView.model.set("visible", anyTileVisible);
        thisView.render();
    };
    
    return View;
});
