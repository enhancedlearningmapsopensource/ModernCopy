/* global config */
define([
    "jquery",
    "core",
    "mustache",
    "text!./logo.html"], 
function(
    $,
    Core,
    Mustache,
    Template
){
                 
    var View = Core.View.extend({     
        template: Template,
        events: {"click": "delegateReset"},
        
        /**
         * Triggered when a user clicks the top left logo. Resets the site and transfers back to the home page
         * @param {event} e - the event
         */
        delegateReset: function(){
            //appstate.get("managers").storage().removeAllStorages();
            if(typeof localStorage !== "undefined"){
                localStorage.clear();
            }
            window.location = "../";
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
            var renderOb = {
                path: config.LOGO_PATH
            };
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }
    });
    return View;
});
