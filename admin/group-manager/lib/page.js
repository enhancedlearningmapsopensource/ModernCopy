define([
    "backbone", 
    "mustache", 
    "lib/group", 
    "lib/user-category",
    "lib/permission-category",
    "lib/preference-category",
    "lib/user-table",
    "lib/preference-table",
    "lib/permission-table"], 
function(
    Backbone, 
    Mustache, 
    GroupView, 
    UserCategoryView,
    PermissionCategoryView,
    PreferenceCategoryView,
    UserTableView,
    PreferenceTableView,
    PermissionTableView
){
              
    var pvt = {
        consts: {
            CREATE_GROUP: gRoot + "admin/group-manager/ajax/create-group.php"
        }
    };
     
    var PageView = Backbone.View.extend({
        
        events: {
            "click .group-new" : "clickNewGroup",
            "click #create-group-btn" : "createNewGroup",
            "click #cancel-group-btn" : "cancelNewGroup"
        },
        
        cancelNewGroup: function(e){
            state.set("activeGroup", null);
        },
        
        /**
         * 
         * @return {undefined}
         */
        changeActiveGroup: function(){
            var thisView = this;
            
             // Show/Hide the new group button
            if(!state.has("activeGroup")){
                thisView.$el.find(".group-new").addClass("open");
            }else{
                thisView.$el.find(".group-new").removeClass("open");
            }
        },
        
        clickNewGroup: function(e){
            var thisView = this;
            
            state.set("activeGroup", "new");
            thisView.$el.find(".group-new").addClass("active");
        },
        
        createNewGroup: function(e){
            var name = $("#new-group-name").val();
            if(name.trim().length > 0){
                $.post(pvt.consts.CREATE_GROUP, {name: name}, function(ret){
                    console.log(ret);
                })
                state.set("activeGroup", null);
            }
        },
        
        initialize: function(options){
            var thisView = this;
            
            // Convert the data to backbone
            var data = options.data;
            
            // Set up the root model
            var rootModel = new Backbone.Model({
                id: 'root-model',
                tables: new Backbone.Collection()
            });
            
            // Set up the tables
            Object.keys(data).forEach(function(tableName){
                var tableModel = new Backbone.Model({
                    id: tableName,
                    data: new Backbone.Collection(),
                    parent: rootModel
                });
                Object.keys(data[tableName]).forEach(function(id){
                    var row = data[tableName][id];
                    row.id = id;
                    row.parent = tableModel;
                    tableModel.get("data").add(new Backbone.Model(row));
                });
                rootModel.get("tables").add(tableModel);
            });
            thisView.model = rootModel;
            
            // Get the template
            var template = $("#page-template").html();
            Mustache.parse(template);
            thisView.model.set("template", template);
            
            thisView.listenTo(state, "change:activeGroup", thisView.changeActiveGroup);
        },
        
        render: function(){
            var thisView = this;
            
            var data = {
                groups: thisView.model.get("tables").get("groups").get("data").map(function(g){
                    return {
                        id: g.id,
                        name: g.get("NAME")
                    };
                })
            };
            
            thisView.$el.html(Mustache.render(thisView.model.get("template"), data));
            
            // Set up the groups
            thisView.model.get("tables").get("groups").get("data").forEach(function(g){
                var groupView = new GroupView({el: $("#group-"+g.id)[0], model: g});
                groupView.render();
            });
            
             // Show/Hide the new group button
            if(!state.has("activeGroup")){
                thisView.$el.find(".group-new").addClass("open");
            }else{
                thisView.$el.find(".group-new").removeClass("open");
            }
            
            // Set up the categories
            var catView = new UserCategoryView({el: $(".category[name='users']")[0], model: thisView.model.get("tables").get("users")});  
            catView.render();
            
            catView = new PermissionCategoryView({el: $(".category[name='permissions']")[0], model: thisView.model.get("tables").get("permissions")});  
            catView.render();
            
            catView = new PreferenceCategoryView({el: $(".category[name='preferences']")[0], model: thisView.model.get("tables").get("preferences")});  
            catView.render();
            
            // Set up the tables
            var tabView = new UserTableView({el: $(".cat-table[name='users']")[0], model: thisView.model.get("tables").get("users")});  
            tabView.render();
            
            tabView = new PreferenceTableView({el: $(".cat-table[name='preferences']")[0], model: thisView.model.get("tables").get("preferences")});
            tabView.render();
            
            tabView = new PermissionTableView({el: $(".cat-table[name='permissions']")[0], model: thisView.model.get("tables").get("permissions")});
            tabView.render();
        }
    });
    
    return PageView;
});