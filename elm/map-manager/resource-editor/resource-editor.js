define(["core",
        "mustache",
        "text!./resource-editor.html",
        "hub-lib"], 
function(Core,
         Mustache,
         Template,
         Hub){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {
            "click .btn-back": "delegateBack",
            "focus input[name='res-title']": "delegateResetLastEdit",
            "focus textarea[name='res-description']": "delegateResetLastEdit",
            "blur input[name='res-title']": "delegateTitleChanged",
            "blur textarea[name='res-description']": "delegateDescriptionChanged",
            "keyup input[name='res-title']": "delegateTitleKeyUp",
            "keyup textarea[name='res-description']": "delegateDescriptionKeyUp",
        },
        
        /**
         * User clicks the "Back" button
         */
        delegateBack: function(e){
            e.preventDefault();
            var thisView = this;
            thisView.model.set("resource", null);
            thisView.model.set("lastedit", null);
        },
        
        delegateTitleChanged: function(e){
            var thisView = this;
            
            var $el = $(e.currentTarget);
            var text = $el.val();
            
            var $status = thisView.$el.find(".title-col > label > .save-status");
            
            $status.html("Saving ..");
            thisView.model.get("resource").save({title: text}, {wait:true}).then(function(){
                $status.html("Saved!");
            });
        },
        
        delegateTitleKeyUp: function(e){
            var thisView = this;
            var now = Date.now();
            thisView.model.set("lastedit", now);
            
            setTimeout(function(){
                var lastEdit = thisView.model.get("lastedit");
                if(lastEdit === now){
                    thisView.delegateTitleChanged(e);
                }
            }, 3000);
        },
        
        delegateDescriptionChanged: function(e){
            var thisView = this;
            
            var $el = $(e.currentTarget);
            var text = $el.val();
            
            var $status = thisView.$el.find(".description-col > label > .save-status");
            
            $status.html("Saving ..");
            thisView.model.get("resource").save({description: text}, {wait:true}).then(function(){
                $status.html("Saved!");
            });
        },
        
        delegateDescriptionKeyUp: function(e){
            var thisView = this;
            var now = Date.now();
            thisView.model.set("lastedit", now);
            
            setTimeout(function(){
                var lastEdit = thisView.model.get("lastedit");
                if(lastEdit === now){
                    thisView.delegateDescriptionChanged(e);
                }
            }, 3000);
        },
        
        /**
         * User clicks in the title or description box.
         */
        delegateResetLastEdit: function(e){
            var thisView = this;
            thisView.model.get("lastedit", null);
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            thisView.listenTo(thisView.model, "change:resource", thisView.render);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var resource = thisView.model.get("resource");
            if(resource === null){
                return;
            }
            
            var renderOb = {
                title: Hub.stripHtml(resource.get("title")),
                description: Hub.stripHtml(resource.get("description"))
            };
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }
    });
    return View;
});
