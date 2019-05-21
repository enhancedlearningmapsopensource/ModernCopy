define(["core",
        "mustache",
        "text!./cell.html",
        "hub-lib"],
function(Core,
         Mustache,
         Template,
         Hub){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {
            "click" : "delegateClick"
        },
        
        delegateClick: function(e){
            e.preventDefault();
            var thisView = this;
            thisView.model.set("selected", !thisView.model.get("selected"));
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            thisView.listenTo(thisView.model, "change:selected", thisView.render)
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {
                name: Hub.stripHtml(thisView.model.get("hubmodel").get("name")),
                selected: thisView.model.get("selected"),
                ord: thisView.model.get("hubmodel").get("ord")
            };
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }
    });
    
    
    return View;
});