define(["core",
        "mustache",
        "text!./column.html",
        "hub-lib"],
function(Core,
         Mustache,
         Template,
         Hub){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {
            "click .inner-column" : "delegateClick"
        },
        
        delegateClick:function(e){
            e.preventDefault();
            var thisView = this;
            
            // Toggle selected
            var selected = !thisView.model.get("selected");
            
            // Toggle cells
            thisView.model.get("cells").forEach(function(d){
                d.set("selected", selected);
            });
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            thisView.listenTo(thisView.model, "change:selected", thisView.render);
            thisView.listenTo(thisView.model.get("cells"), "change:selected", pvt.cellSelectedChanged);
            
            
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            
            // Get the name
            var name = Hub.stripHtml(thisView.model.get("hubmodel").get("name"));
            
            // Get the short version
            var short = Hub.stripHtml(thisView.model.get("hubmodel").get("short"));
            short = (short === null || typeof short === "undefined" || short.trim().length === 0) ? name : short;
            
            var renderOb = {
                name: name,
                selected: thisView.model.get("selected"),
                short: short,
                span: Number(thisView.model.get("hubmodel").get("columnspan"))
            };
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }
    });
    
    pvt.cellSelectedChanged = function(model){
        var thisView = this;
        var areAllSelected = thisView.model.get("cells").reduce(function(acc, val){
            return (acc && val.get("selected"));
        }, true);
        thisView.model.set("selected", areAllSelected);
    };
    
    
    return View;
});