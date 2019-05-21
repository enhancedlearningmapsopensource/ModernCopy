define([
    "core",
    "jquery",
    "mustache",
    "text!./navbar-dropdown-button.html"
], 
function(
    Core,
    $,
    Mustache,
    Template
){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {
            "mousedown .nav-drop-down-item": "delegateCaptureMouseDown" ,
            "click .nav-button-row": "delegateToggle" ,
            "click .nav-drop-down-item": "delegateClickItem"
        },
        
        delegateCaptureMouseDown: function(e){
            return false;
        },
        
        delegateClickItem: function(e){
            var thisView = this;
            var index = Number($(e.currentTarget).attr("name").split("item-")[1]);
            var item = thisView.model.get("items")[index];
            
            if(item.hasOwnProperty("overlay")){
                pvt.openOverlay(item.overlay + "Open");
            }else if(item.hasOwnProperty("action")){
                item.action();
            }else{
                throw Error();
            }
            
            thisView.model.set("open", false);
        },
        
        delegateToggle: function(e){
            var thisView =this;
            
            // If there are items then display them. If not then check for action
            if(thisView.model.get("items").length > 0){
                thisView.model.set("open", !thisView.model.get("open"));
            }else if(thisView.model.has("action")){
                thisView.model.get("action")();
            }else{
                throw Error("Don't know how to handle button.");
            }
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            thisView.listenTo(thisView.model, "change:name", thisView.render);
            thisView.listenTo(thisView.model, "change:sub", thisView.render);
            thisView.listenTo(thisView.model, "change:open", thisView.render);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var items = [];
            if(thisView.model.has("items")){
                items = thisView.model.get("items").map(function(d, i){
                    return {
                        index: i,
                        name: d.name
                    };
                });
            }
            
            var showSub = false;
            if(thisView.model.has("sub") && thisView.model.get("sub").trim().length > 0){
                showSub = true;
            }
            
            var renderOb = {
                "name": thisView.model.get("name"),
                "sub": thisView.model.get("sub"),
                "showsub": showSub,
                "items": items,
                "hasitems": items.length > 0,
                "open": thisView.model.get("open")
            };
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }
    });
    
    /**
     * Open the given overlay.
     * @param {string} overlay - the overlay to open
     * @returns {undefined}
     */
    pvt.openOverlay = function(overlay){
        let thisView = this;
        
        if(window.appstate.get(overlay) === true){
            window.appstate.set({
                overlay: false
            }, {silent: true});
        }
        
        // Open the overlay and close the omnisearch bar
        var modelSet = {};
        modelSet[overlay] = true;
        
        window.appstate.set(modelSet);
        
    };
    
    return View;
});
