define(["backbone",
        "core",
        "mustache",
        "text!./edit-mode-warning-screen.html",
        "hub-lib"], 
function(Backbone,
         Core,
         Mustache,
         Template,
         Hub){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {
            "click .turn-off-edit-mode" : "delegateTurnOffEditMode"
        },
        
        delegateTurnOffEditMode: function(e){
            e.preventDefault();
            
            var pref = Hub.get("preference").findWhere({"program_code": "EDIT_ON"});
            var userpref = Hub.get("userpreference").where({preferenceid: pref.id, userid: userID}, false, Hub);
            
            assert(userpref.length === 1);
            
            return userpref[0].save({"val": "f"}, {wait:true}).then(function(){
                localStorage.clear();
                location.reload();
            });
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            thisView.model = new Backbone.Model({
                id: "edit-mode-warning-model",
                visible: false
            });
            
            thisView.listenTo(Hub.get("userpreference"), "add", pvt.preferenceChanged);
            thisView.listenTo(Hub.get("userpreference"), "update", pvt.preferenceChanged);
            thisView.listenTo(Hub.get("userpreference"), "change", pvt.preferenceChanged);
            thisView.listenTo(Hub.get("preference"), "add", pvt.preferenceChanged);
            thisView.listenTo(Hub.get("preference"), "update", pvt.preferenceChanged);
            thisView.listenTo(Hub.get("preference"), "change", pvt.preferenceChanged);
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
        }
    });
    
    pvt.preferenceChanged = function(model){
        var thisView = this;
        var pref = getPreference("EDIT_ON");
        if(pref !== null){
            thisView.model.set("visible", (pref === "t"));
        }
    };
    
    return View;
});