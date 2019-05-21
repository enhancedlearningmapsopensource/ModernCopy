define(["core",
        "mustache",
        "text!./map-row.html",
        "hub-lib"], 
function(Core,
         Mustache,
         Template,
         Hub){
             
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
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {
                title: Hub.stripHtml(thisView.model.get("hubmodel").get("title")),
                date: Hub.stripHtml(thisView.model.get("hubmodel").get("datecreated")),
                description: Hub.stripHtml(thisView.model.get("hubmodel").get("description"))
            };
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }
    });
    return View;
});
