define(["core",
        "mustache",
        "text!./map-legend.html"], 
function(Core,
         Mustache,
         Template){
             
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
            
            thisView.listenTo(appstate, "change:sidePanel", thisView.render);
            thisView.listenTo(appstate.get("selectedcircles"), "update", thisView.render);
            thisView.listenTo(appstate.get("selectedcircles"), "reset", thisView.render);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var sidePanelOpen = appstate.get("sidepanelopen");
            
            var classes = [];
            
            // Check for side panel open
            if(sidePanelOpen === true){
                classes.push("side-open");
            }
            
            // Check for bottom panel open
            var selectedCircle = appstate.get("selectedcircles");
            var selectedEdge = appstate.get("selectededge");
            if (selectedCircle.length > 0 || selectedEdge !== null) {
                classes.push("bottom-open");
            }
            
            // Check for minimized panel open
            
            
            var renderOb = {
                classes: classes
            };
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }
    });
    return View;
});
