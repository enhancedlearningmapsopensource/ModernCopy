define(["core",
        "mustache",
        "text!./search-closed.html"], 
function(Core,
         Mustache,
         Template){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {
            "focus input[type=text]": "delegateFocus",
            "click input[type=text]": "delegateFocus"
        },
        
        delegateFocus: function (e) {
            var thisView = this;
            thisView.model.set("open", true);
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
            var renderOb = {};
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            if(thisView.model.get("searchbar") === null){
                thisView.model.set("searchbar", thisView.$el.find("input[type='text']"));
            }
        }
    });
    return View;
});
