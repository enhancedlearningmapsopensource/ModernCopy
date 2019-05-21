define(["core",
        "./page/page",
        "./page/page-model"], 
function(Core,
         Page,
         PageModel){

    var View = Core.View.extend({
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            
            // Set up child view
            thisView.add("page-view", new Page({
                id: "page-view",
                model: new PageModel()
            })).render();
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            
            // Detach
            thisView.get("page-view").$el.detach();
            
            // Reattach
            thisView.$el.prepend(thisView.get("page-view").$el);
        }
    });
    return View;
});
