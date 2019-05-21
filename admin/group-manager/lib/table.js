define(["jsclass!admin-main/js-class-require/","backbone", "mustache"], function(JsClass, Backbone, Mustache){
    var TableView = Backbone.View.extend({
        
        events:{
            "click .tab-btn" : "clickTabBtn",
            "click #new-row" : "clickNewRow",
            "click #cancel-new-row" : "cancelNewRow"
        },
        
        addTemplate: function(name){
            var thisView = this;
            var template = $("#" + name).html();
            Mustache.parse(template);
            thisView.model.set(name, template);
        },
        
        cancelNewRow:function(e){
            var thisView = this;
            thisView.$el.find("#new-permission-form").removeClass("open");
            thisView.$el.find("#new-row").removeClass("closed");
        },
        
        clickTabBtn: function(e){
            var thisView = this;
            
            var $el = $(e.currentTarget);
            
            var cellIndex = Number($el.parents(".table-cell").attr("id").split("c-")[1]);
            var rowIndex = Number($el.parents("tr").attr("id").split("r-")[1]);
            state.set({
                activeRow: rowIndex,
                activeCell: cellIndex
            });
        },
        
        clickNewRow: function(e){
            var thisView = this;
            thisView.$el.find("#new-permission-form").addClass("open");
            thisView.$el.find("#new-row").addClass("closed");
        },
        
        initialize: function(){
            var thisView = this;
            
            if(!thisView.model.has("active")){
                thisView.model.set("active", false);
            }
            
            // Get the template
            thisView.addTemplate("table-template");
            
            // Get the category name
            thisView.model.set("category", thisView.$el.attr("name"));
            
            thisView.listenTo(state, "change:activeGroup", thisView.render);
            thisView.listenTo(state, "change:activeCategory", thisView.render);
            thisView.listenTo(state, "change:activeRow", thisView.render);
            thisView.listenTo(state, "change:activeCell", thisView.render);
        },
        
        render: function(){
            var thisView = this;
            thisView.model.set("active", false);
            
            if(!state.has("activeGroup") || (state.has("activeGroup") && !state.has("activeCategory"))){
                thisView.$el.removeClass("active");
            }
            
            else if(state.has("activeGroup") && state.has("activeCategory")){
                if(state.get("activeCategory").localeCompare(thisView.model.get("category")) === 0){
                    thisView.$el.addClass("active");
                    thisView.model.set("active", true);
                }else{
                    thisView.$el.removeClass("active");
                }
            }
        }
    });
    
    // ===================================================================
    // Export function to allow the object to be extended
    // ===================================================================
    TableView.extend = function (child) {
        var ex = Backbone.View.extend.apply(this, arguments);
        ex.prototype.events = _.extend({}, this.prototype.events, child.events);
        return ex;
    };
    
    return TableView;
});