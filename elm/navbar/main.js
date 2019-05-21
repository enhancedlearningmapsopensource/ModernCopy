define(["core",
        "./bar/bar",
        "./bar/bar-model"], 
function(Core,
         Bar,
         BarModel){
             
    return {
        create: function(options){
            return new Bar({
                id: "bar-view",
                model: new BarModel()
            });
        }
    };
             
    var pvt = {
        consts: {
        }
    };         
    var View = Core.View.extend({     
        events: {},
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            
            // Set up child view
            thisView.add("bar-view", ).render();
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {};
            console.log("rendering navbar.");
            
            // Detach
            thisView.get("bar-view").$el.detach();
            
            // Reattach
            thisView.$el.html(thisView.get("bar-view").$el);
        }
    });
    return View;
});