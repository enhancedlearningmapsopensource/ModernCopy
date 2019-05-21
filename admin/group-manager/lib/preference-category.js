define(["lib/category", "mustache"], function(CategoryView, Mustache){
    
    var pvt = {
        consts: {
            NAME: "Preferences"
        }
    };
    
    var PreferenceCategoryView = CategoryView.extend({
        render: function(){
            var thisView = this;
            CategoryView.prototype.render.call(thisView);
            
            if(state.has("activeGroup")){
                var data = {name: pvt.consts.NAME};
                if(!state.has("activeCategory")){
                    var activeGroup = Number(state.get("activeGroup"));
                    data.list = thisView.model.get("data").filter(function(preference){
                        return (preference.get("GROUPID") === activeGroup);
                    }).map(function(preference){
                        return preference.get("NAME");
                    });
                }
                thisView.$el.html(Mustache.render(thisView.model.get("category-template"), data));
            }
        }
    });
    
    return PreferenceCategoryView;
});