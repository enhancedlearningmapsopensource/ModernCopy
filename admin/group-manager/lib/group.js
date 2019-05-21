define(["jsclass!admin-main/js-class-require/","backbone", "mustache"], function(JsClass, Backbone, Mustache){
    var pvt = {}
    
    
    var PageView = Backbone.View.extend({
        events:{
            "click" : "click"
        },
        
        click: function(e){
            var thisView = this;
            
            var id = Number($(e.currentTarget).attr("id").split("group-")[1]);
            if(!state.has("activeGroup")){
                state.set({activeGroup: id});
            }else{
                state.set({
                    activeGroup: null,
                    activeCategory: null
                });
            }
        },
        
        initialize: function(){
            var thisView = this;
            if(!thisView.model.has("open")){
                thisView.model.set("open", true);
            }
            if(!thisView.model.has("active")){
                thisView.model.set("active", false);
            }      
            thisView.model.set("groupID", Number(thisView.$el.attr("id").split("group-")[1]));
            //thisView.listenTo(thisView.model, "change:open", thisView.render);
            thisView.listenTo(state, "change:activeGroup", thisView.render);
        },
        
        render: function(){
            var thisView = this;
            
            // Open == Visible
            var shouldOpen = false;
            
            if(!state.has("activeGroup")){// && !thisView.$el.hasClass("open")){
                shouldOpen = true;
            }
            
            else if (state.has("activeGroup") && state.get("activeGroup") === thisView.model.get("groupID")){
                shouldOpen = true;
            }
            
            if(shouldOpen && !thisView.$el.hasClass("open")){
                thisView.$el.addClass("open");
            }else if(!shouldOpen && thisView.$el.hasClass("open")){
                thisView.$el.removeClass("open");
            }
        }
    });
    
    return PageView;
});