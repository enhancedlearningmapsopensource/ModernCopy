define(["core",
        "mustache",
        "text!./subject-tab.html",
        "hub-lib"], 
function(Core,
         Mustache,
         Template,
         Hub){
             
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
            appstate.set("activeSubject", thisView.model.get("hubmodel").get("name").toLowerCase());
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            thisView.listenTo(thisView.model.collection, "add", thisView.render);
            thisView.listenTo(appstate, "change:activeSubject", thisView.render);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var activeSubject = appstate.get("activeSubject");
            var name = Hub.stripHtml(thisView.model.get("hubmodel").get("name"));
            
            var renderOb = {
                name: name,
                "subject-col-num": 12 / thisView.model.collection.length,
                "selected": (activeSubject === name.toLowerCase())
            };
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }
    });
    return View;
});
