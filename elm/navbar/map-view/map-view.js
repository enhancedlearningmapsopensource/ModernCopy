define(["core",
        "mustache",
        "text!./map-view.html",
        "hub-lib",
        "activeGraph"], 
function(Core,
         Mustache,
         Template,
         Hub,
         ActiveGraph){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {
            "mousedown": "delegateCaptureMouseDown",
            "click": "delegateClick"
        },
        
        delegateCaptureMouseDown: function(e){
            return false;
        },
        
        delegateClick: function(e){
            var thisView = this;
            ActiveGraph.loadGraph(thisView.model, thisView.model.id, {update: false, close: true});
            application.graphstate.apply({activeWindow: "graph"});
            thisView.model.set("close", true);
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var map = thisView.model.get("hubmodel");

            // Get map-node relationship
            var wrapped = Hub.wrap(map);
            var mapColor = wrapped.colorStatus();
            var mapOwner = wrapped.ownerStatus();
            
            // Build initial render object
            var renderOb = {
                mapid: map.id,
                title: Hub.stripHtml(map.get("title")),
                numNodes: Hub.wrap(map).nodeIDs().length,
                path: gRoot,
                elmiconpath: config.ICON_PATH
            };
            
            // Add color
            renderOb[mapColor] = true;

            // Add owner
            if(mapOwner === "elm"){
                renderOb.elm = true;
            }else if(mapOwner === "user"){
                renderOb.u = true;
            }
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }
    });
    return View;
});
