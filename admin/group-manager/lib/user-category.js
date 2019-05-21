define(["lib/category", "mustache"], function(CategoryView, Mustache){
    var pvt = {
        consts: {
            NAME: "Users"
        }
    };
    
    
    var UserCategoryView = CategoryView.extend({
        render: function(){
            var thisView = this;
            CategoryView.prototype.render.call(thisView);
            
            if(state.has("activeGroup")){
                var data = {name: pvt.consts.NAME};
                if(!state.has("activeCategory")){
                    var activeGroup = Number(state.get("activeGroup"));
                    data.list = thisView.model.get("data").filter(function(user){
                        var check = user.get("GROUPS").find(function(d){
                            return d === activeGroup;
                        });
                        return (typeof check !== 'undefined');
                    }).map(function(user){
                        return user.get("EMAIL");
                    });
                }
                thisView.$el.html(Mustache.render(thisView.model.get("category-template"), data));
            }
        }
    });
    
    return UserCategoryView;
});