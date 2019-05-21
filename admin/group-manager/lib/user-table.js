define(["jsclass!admin-main/js-class-require/","lib/table", "mustache"], function(JsClass,TableView, Mustache){

    if(gRoot !== "../"){
        throw Error();
    }
    var pvt = {
        consts: {
            AJAX_PATH: gRoot + "admin/group-manager/ajax/"
        }
    };
    pvt.consts.REMOVE_USER_GROUP    = pvt.consts.AJAX_PATH + "remove-user-from-group.php";
    pvt.consts.ADD_USER_GROUP       = pvt.consts.AJAX_PATH + "add-user-to-group.php";
    
    var UserTableView = TableView.extend({
        
        events:{
            "click .assigned" : "clickAssigned",
            "click .avaliable" : "clickAvaliable",
        },
        
        /**
         * User clicks on an 'assigned' group
         */
        clickAssigned: function(e){
            var thisView = this;
            var tableData = thisView.model.get("displayed");
            
            if(thisView.model.get("active")){
                var $el = $(e.currentTarget);
                var groupID = Number($el.attr("id").split("group-")[1]);
                
                if(state.get("activeRow") > tableData.tables[0].rows.length){
                    var userEmail = tableData.tables[1].rows[state.get("activeRow") - tableData.tables[0].rows.length].cells[0].text.trim();
                }else{
                    var userEmail = tableData.tables[0].rows[state.get("activeRow")].cells[0].text.trim();
                }
                
                
                pvt.removeUserFromGroup(userEmail, groupID);
                
                
                var user = thisView.model.get("data").findWhere({EMAIL: userEmail});
                var groups = new JsClass.Set(user.get("GROUPS").map(function(d){return d;}));
                groups.remove(groupID);
                if(groups.length === 0){
                    groups.add(0);
                }
                
                var newGroups = groups.map(function(d){return d;});
                user.set("GROUPS", newGroups);
                
                $el.parents("td").html(Mustache.render(thisView.model.get("edit-user-group"), {
                    moddata: pvt.getModData.call(thisView, user)
                }));
            }
        },  
        
        /**
         * User clicks on an 'avaliable' group
         */
        clickAvaliable: function(e){
            var thisView = this;
            var tableData = thisView.model.get("displayed");
            
            if(thisView.model.get("active")){
                var $el = $(e.currentTarget);
                var groupID = Number($el.attr("id").split("group-")[1]);
                var userEmail = tableData.tables[0].rows[state.get("activeRow")].cells[0].text.trim();
                
                pvt.addUserToGroup(userEmail, groupID);
                
                var user = thisView.model.get("data").findWhere({EMAIL: userEmail});
                var groups = new JsClass.Set(user.get("GROUPS").map(function(d){return d;}));
                groups.add(groupID);
                groups.remove(0);
                
                var newGroups = groups.map(function(d){return d;});
                user.set("GROUPS", newGroups);
                
                $el.parents("td").html(Mustache.render(thisView.model.get("edit-user-group"), {
                    moddata: pvt.getModData.call(thisView, user)
                }));
            }
        },
        
        initialize: function(){
            var thisView = this;
            TableView.prototype.initialize.call(thisView);
            thisView.addTemplate("edit-user-group");
        },
        
        render: function(){
            var thisView = this;
            TableView.prototype.render.call(thisView);
            
            if(thisView.model.get("active")){
                var activeGroup = Number(state.get("activeGroup"));
                var groupData = {
                    colspan: 2,
                    tabletitle: "Users with Selected Group",
                    headers: ["Email", "Groups"],
                    rows: thisView.model.get("data").filter(function(user){
                        var check = user.get("GROUPS").find(function(d){
                            return (d === activeGroup || (user.get("GROUPS").length === 1 && user.get("GROUPS")[0] === 0));
                        });
                        return (typeof check !== 'undefined');
                    }).map(function(user, j){
                        var row = {
                            i: j,
                            cells: [
                                {
                                    i: 0,
                                    text: user.get("EMAIL")
                                },
                                {
                                    i: 1,
                                    textset: user.get("GROUPS").map(function(d, i){
                                        return {
                                            i: i,
                                            v: (d === 0) ? "none" : thisView.model.collection.get("groups").get("data").get(d).get("NAME")
                                        };
                                    })
                                }
                            ]
                        };
                        
                        if(state.has("activeRow") && state.get("activeRow") === j){
                            row.mod = true;
                            row.moddata = pvt.getModData.call(thisView, user);
                        }
                        
                        return row;
                    })
                };
                
                /*var orphanData = {
                    colspan: 2,
                    tabletitle: "Users with no Group",
                    headers: ["Email", "Groups"],
                    rows: thisView.model.get("data").filter(function(user){
                        return (user.get("GROUPS").length === 1 && user.get("GROUPS")[0] === 0);
                    }).map(function(user, j){
                        return {
                            i: groupData.rows.length + j,
                            cells: [
                                {
                                    i: 0,
                                    text: user.get("EMAIL")
                                },
                                {
                                    i: 1,
                                    textset: user.get("GROUPS").map(function(d,i){
                                        return {
                                            i: i,
                                            v: "none"
                                        };
                                    })
                                }
                            ]
                        };
                    })
                };*/
                
                var data = {
                    tables: [
                        groupData//,
                        //orphanData
                    ]
                };
                
                // Save the data for referencing later
                thisView.model.set("displayed", data);
                
                thisView.$el.html(Mustache.render(thisView.model.get("table-template"), data, 
                {sub: thisView.model.get("edit-user-group")}));
            }
            
            
        }
    });
   
    
    /**
     * Get data to display in 'edit-user-group' area
     * @param {Model} user - the user
     * @return {user-tableL#1.pvt.getModData.groupData}
     */
    pvt.getModData = function(user){
        var thisView = this;
        
         // Get groups for this user
        var userGroups = new JsClass.Set(user.get("GROUPS"));

        // Get all groups
        var allGroups = thisView.model.collection.get("groups").get("data");
        var allGroupIDs = new JsClass.Set(allGroups.map(function(d){
            return Number(d.id);
        }));

        // Get groups NOT assigned to user
        var unassignedGroups = allGroupIDs.difference(userGroups);

        // Set up the data
        var groupData = {
            assigned: userGroups.filter(function(d){
                return d !== 0;
            }).map(function(d){
                return {
                    id: d,
                    name: allGroups.get(d).get("NAME")
                };
            }),
            avaliable: unassignedGroups.map(function(d){
                return {
                    id: d,
                    name: allGroups.get(d).get("NAME")
                };
            })
        };
        return groupData;
    };
    
    pvt.addUserToGroup = function(email, groupID){
        $.post(pvt.consts.ADD_USER_GROUP, {email: email, groupid: groupID}, function(ret){
            console.log(ret);
        });
    };
    
    pvt.removeUserFromGroup = function(email, groupID){
        $.post(pvt.consts.REMOVE_USER_GROUP, {email: email, groupid: groupID}, function(ret){
            console.log(ret);
        });
    };
    
   
    
    return UserTableView;
});