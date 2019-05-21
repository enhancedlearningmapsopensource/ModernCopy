define(["lib/category", "mustache"], function(CategoryView, Mustache){
    
    var pvt = {
        consts: {
            NAME: "Permissions"
        }
    };
    
    var PermissionCategoryView = CategoryView.extend({
        render: function(){
            var thisView = this;
            CategoryView.prototype.render.call(thisView);
            
            if(state.has("activeGroup")){
                var data = {name: pvt.consts.NAME};
                if(!state.has("activeCategory")){
                    var activeGroup = Number(state.get("activeGroup"));
                    data.list = thisView.model.get("data").filter(function(permission){
                        var check = permission.get("GROUPS").find(function(d){
                            return d === activeGroup;
                        });
                        return (typeof check !== 'undefined');
                    }).map(function(permission){
                        return permission.get("NAME");
                    });
                }
                thisView.$el.html(Mustache.render(thisView.model.get("category-template"), data));
            }
        }
    });
    
    return PermissionCategoryView;
});