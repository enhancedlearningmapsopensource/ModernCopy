/* global state */

define(["backbone", "mustache"], function(Backbone, Mustache){
    var CategoryView = Backbone.View.extend({
        events:{
            "click" : "click"
        },
        
        /**
         * User clicks on a category tab
         */
        click: function(e){            
            var nextCategory = null;
            var clickedCategory = $(e.currentTarget).attr("name");
            
            // No category has been selected yet
            if(!state.has("activeCategory")){
                nextCategory = clickedCategory;
            }
            
            // Category is different from the one currently open
            else if(state.get("activeCategory").localeCompare(clickedCategory) !== 0){
                nextCategory = clickedCategory;
            }
            
            state.set({
                activeCategory: nextCategory,
                activeRow: null,
                activeCell: null
            });
        },
        
        initialize: function(){
            var thisView = this;
            if(!thisView.model.has("open")){
                thisView.model.set("open", false);
            }
            if(!thisView.model.has("compressed")){
                thisView.model.set("compressed", false);
            }
            if(!thisView.model.has("active")){
                thisView.model.set("active", false);
            }
            
            // Get the template
            var template = $("#category-template").html();
            Mustache.parse(template);
            thisView.model.set("category-template", template);
            
            // Get the category name
            thisView.model.set("category", thisView.$el.attr("name"));
            
            // Listen for active groups
            thisView.listenTo(state, "change:activeGroup", thisView.render);
            thisView.listenTo(state, "change:activeCategory", thisView.render);
            //thisView.listenTo(thisView.model.get("parent").get("tables").get("groups").get("data"), "change:active", thisView.activeGroupChanged);
            //thisView.listenTo(thisView.model, "change:open", thisView.render);
            //thisView.listenTo(thisView.model, "change:compressed", thisView.render);
            //thisView.listenTo(thisView.model, "change:active", thisView.render);
        },
        
        render: function(){
            var thisView = this;
            
            // Possible classes: open, (open + compressed), (open + compressed + active)
            
            if(state.has("activeGroup") && !state.has("activeCategory")){
                thisView.$el.addClass("open");
                thisView.$el.removeClass("compressed");
                thisView.$el.removeClass("active");
            }
            
            else if(state.has("activeGroup") && state.has("activeCategory")){
                thisView.$el.addClass("open");
                thisView.$el.addClass("compressed");
                if(state.get("activeCategory").localeCompare(thisView.model.get("category")) === 0){
                    thisView.$el.addClass("active");
                }else{
                    thisView.$el.removeClass("active");
                }
            }
            
            else if(!state.has("activeGroup")){
                thisView.$el.removeClass("open");
                thisView.$el.removeClass("compressed");
                thisView.$el.removeClass("active");
            }
            
            /*["open", "compressed", "active"].forEach(function(s){
                if(thisView.model.get(s) && !thisView.$el.hasClass(s)){
                    thisView.$el.addClass(s)
                }else if(!thisView.model.get(s) && thisView.$el.hasClass(s)){
                    thisView.$el.removeClass(s);
                }
            });*/
        }
    });
    
    // ===================================================================
    // Export function to allow the object to be extended
    // ===================================================================
    CategoryView.extend = function (child) {
        var ex = Backbone.View.extend.apply(this, arguments);
        ex.prototype.events = _.extend({}, this.prototype.events, child.events);
        return ex;
    };
    
    return CategoryView;
});