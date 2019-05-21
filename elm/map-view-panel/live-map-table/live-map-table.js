define(["core",
        "mustache",
        "text!./live-map-table.html",
        "hub-lib",
        "../map-row/map-row"], 
function(Core,
         Mustache,
         Template,
         Hub,
         MapRow){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {},
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            thisView.listenTo(Hub.get("map"), "add", pvt.hubMapAdded);
            thisView.listenTo(Hub.get("map"), "update", thisView.render);
            thisView.listenTo(thisView.model.get("rows"), "add", pvt.rowAdded);
            
            // Add existing maps
            Hub.get("map").forEach(function(d){
                pvt.hubMapAdded.call(thisView, d);
            });
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {};
            
            var views = thisView.detachGroup("row-views");
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            views.forEach(function(d){
                thisView.$el.append(d.$el);
            });
                
        }
    });
    
    pvt.hubMapAdded = function(model){
        var thisView = this;
        thisView.model.get("rows").add({
            id: model.id,
            hubmodel: model
        });
    };
    
    pvt.rowAdded = function(model){
        var thisView = this;
        thisView.addToGroup("row-views", new MapRow({
            id: model.id,
            model: model
        }), model.id).render();
    };
    
    
    return View;
});
