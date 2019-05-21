define(["jsclass!admin-main/js-class-require/","lib/table", "mustache"], function(JsClass,TableView, Mustache){
    var pvt = {
        consts: {
            AJAX_PATH: gRoot + "admin/group-manager/ajax/"
        }
    };
    pvt.consts.CREATE_PERMISSION        = pvt.consts.AJAX_PATH + "create-permission.php";
    pvt.consts.DELETE_PERMISSION        = pvt.consts.AJAX_PATH + "delete-permission.php";
    pvt.consts.EDIT_PERMISSION          = pvt.consts.AJAX_PATH + "edit-permission.php";
    pvt.consts.ADD_GROUP                = pvt.consts.AJAX_PATH + "add-permission-to-group.php";
    pvt.consts.REMOVE_GROUP             = pvt.consts.AJAX_PATH + "remove-permission-from-group.php";
    
    var PermissionTableView = TableView.extend({
        
        events:{
            "click .assigned" : "clickAssigned",
            "click .avaliable" : "clickAvaliable",
            //"click #new-permission" : "clickNewPermission",
            "click #ok-new-row" : "createNewPermission",
            "click #name-cancel" : "cancelEdit",
            "click #name-ok" : "editName",
            "click #description-ok" : "editDescription",
            "click #programcode-ok" : "editProgramCode",
            "click #delete-permission > .delete-ok" : "deletePermission"
        },
        
        cancelEdit: function(e){
            state.set("activeRow", null);
            state.set("activeCell", null);
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
                    var userEmail = tableData.tables[0].rows[state.get("activeRow")].cells[0].textset[0].v.trim();
                }
                
                // Get the permission id
                var activeRow = state.get("activeRow");
                var tableData = thisView.model.get("displayed").tables[0].rows[activeRow];
                var permissionID = tableData.id;
                
                pvt.removePermissionFromGroup(groupID, permissionID);
                
                // Get the permission object
                var permission = thisView.model.get("data").get(permissionID);
                var groups = new JsClass.Set(permission.get("GROUPS").map(function(d){return d;}));
                groups.remove(groupID);
                if(groups.length === 0){
                    groups.add(0);
                }
                
                var newGroups = groups.map(function(d){return d;});
                permission.set("GROUPS", newGroups);
                
                $el.parents("td").html(Mustache.render(thisView.model.get("edit-user-group"), {
                    moddata: pvt.getGroupModData.call(thisView, permission)
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
                var userEmail = tableData.tables[0].rows[state.get("activeRow")].cells[0].textset[0].v.trim();
                
                // Get the permission id
                var permissionID = pvt.getActivePermissionID.call(thisView);
                
                pvt.addPermissionToGroup(permissionID, groupID);
                
                // Get the permission object
                var permission = thisView.model.get("data").get(permissionID);
                var groups = new JsClass.Set(permission.get("GROUPS").map(function(d){return d;}));
                groups.add(groupID);
                groups.remove(0);
                
                var newGroups = groups.map(function(d){return d;});
                permission.set("GROUPS", newGroups);
                
                $el.parents("td").html(Mustache.render(thisView.model.get("edit-user-group"), {
                    moddata: pvt.getGroupModData.call(thisView, permission)
                }));
            }
        },
        
        /*clickNewPermission: function(e){
            var thisView = this;
            thisView.$el.find("#new-permission-form").addClass("open");
        },*/
        
        createNewPermission: function(e){
            var thisView = this;
            var $form = $("#new-permission-form");
            var name = $form.find("#name").val();
            if(name.trim().length > 0){
                pvt.createPermission.call(thisView, name);
            }
        },
        
        /**
         * User clicks OK in the delete confirmation
         */
        deletePermission: function(e){
            var thisView = this;
            
            // Get the active permission id
            var permissionID = pvt.getActivePermissionID.call(thisView);
            
            // Delete the permission
            pvt.deletePermission.call(thisView, permissionID);
            
            // Refresh
            thisView.render();
        },
        
        /**
         * Apply change to the description
         */
        editDescription: function(e){
            var thisView = this;
            var desc = thisView.$el.find("#edit-description-string").find("#description").val();
            
            var permissionID = pvt.getActivePermissionID.call(thisView);
                       
            if(desc.trim().length > 0){
                pvt.edit.call(thisView, permissionID, {description: desc});
            }
        },
        
        /**
         * Apply change to name
         */
        editName: function(e){
            var thisView = this;
            var name = thisView.$el.find("#edit-name-string").find("#name").val();
            
            var permissionID = pvt.getActivePermissionID.call(thisView);      
            if(name.trim().length > 0){
                pvt.edit.call(thisView, permissionID, {name: name});
            }
        },
        
        /**
         * Apply change to name
         */
        editProgramCode: function(e){
            var thisView = this;
            var programCode = thisView.$el.find("#edit-programcode-string").find("#programcode").val();
            
            var permissionID = pvt.getActivePermissionID.call(thisView);  
            if(programCode.trim().length > 0){
                pvt.edit.call(thisView, permissionID, {programcode: programCode});
            }
        },
        
        initialize: function(){
            var thisView = this;
            TableView.prototype.initialize.call(thisView);
            thisView.addTemplate("new-permission");
            thisView.addTemplate("edit-string");
            thisView.addTemplate("edit-user-group");
            thisView.addTemplate("delete-confirm");
        },
        
        render: function(){
            var thisView = this;
            TableView.prototype.render.call(thisView);
            
            if(thisView.model.get("active")){
                var activeGroup = Number(state.get("activeGroup"));
                var groupData = pvt.getTable.call(thisView);
                
                var data = {
                    tables: [
                        groupData//,
                        //orphanData
                    ]
                };
                
                // Save the data for referencing later
                thisView.model.set("displayed", data);
                var modifierTemplate = pvt.getModifierTemplate();
                
                // A modified template has been provided
                if(modifierTemplate.trim().length > 0){
                    if(!thisView.model.has(modifierTemplate)){
                        throw Error("Undefined template: " + modifierTemplate);
                    }
                    thisView.$el.html(Mustache.render(thisView.model.get("table-template"), data, 
                    {sub: thisView.model.get(modifierTemplate)}));
                }
                
                // A modified template has not been provided
                else{
                    thisView.$el.html(Mustache.render(thisView.model.get("table-template"), data));
                }
                
                
                //if(modifierTemplate.trim().length > 0){
                //    thisView.$el.find("div:first").append(Mustache.render(thisView.model.get("new-permission"), {sub: thisView.model.get(modifierTemplate)}));
                //}else{
                thisView.$el.find("div:first").append(Mustache.render(thisView.model.get("new-permission"), {type: "permission"}));
                //}
                
            }
            
            
        }
    });
    
    pvt.addPermissionToGroup = function(permissionID, groupID){
        $.post(pvt.consts.ADD_GROUP, {permissionid: permissionID, groupid: groupID}, function(ret){
            console.log(ret);
        });
    };
    
    pvt.createPermission = function(name){
        var thisView = this;
        $.post(pvt.consts.CREATE_PERMISSION, {name: name}, function(ret){
            var newPermission = JSON.parse(ret);
            
            var tableData = thisView.model.get("data");
            tableData.add(newPermission);
            
            thisView.$el.find("#new-permission-form").removeClass("open");
            thisView.render();
        });
    };
    
    pvt.deletePermission = function(permissionID){
        var thisView = this;
        $.post(pvt.consts.DELETE_PERMISSION, {permissionid: permissionID}, function(ret){
            console.log(ret);
            
            var tableData = thisView.model.get("data");
            tableData.remove(permissionID);
            
            state.set({
                activeRow: null,
                activeCell: null
            });
            thisView.render();
        });
    };
   
    
    /**
     * Get data to display in modifier area
     * @param {Model} user - the user
     * @return {user-tableL#1.pvt.getModData.groupData}
     */
    pvt.getModData = function(permission){
        var thisView = this;
        
        var activeCell = state.get("activeCell");
        switch(activeCell){
            case 0: // NAME
                return {
                    name: "Name",
                    txtid: "name",
                    value: permission.get("NAME")
                };
                
            case 1: // DESCRIPTION
                return {
                    name: "Description",
                    txtid: "description",
                    value: permission.get("DESCRIPTION")
                };
                
            case 2: // PROGRAM CODE
                return {
                    name: "Program Code",
                    txtid: "programcode",
                    value: permission.get("PROGRAM_CODE")
                };
                
            case 3: // GROUPS
                return pvt.getGroupModData.call(thisView, permission);
            
            case 4: // DELETE
                return {
                    msg: "Are you sure you want to delete the permission '"+permission.get("NAME")+"'. This action cannot be undone.",
                    id: 'permission'
                };
        }
        
        throw Error();
        
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
    
    /**
     * Get the active permission
     * @return {number} - the id of the active permission
     */
    pvt.getActivePermissionID = function(){
        var thisView = this;
        
        var activeRow = state.get("activeRow");
        var tableData = thisView.model.get("displayed").tables[0].rows[activeRow];
        var permissionID = tableData.id;
        if(!$.isNumeric(permissionID)){
            throw Error("Permission id is invalid: " + permissionID);
        }
        
        return permissionID;
    };
    
    /**
     * Gets the active permission model. If the id is provided then it will
     * be used to get the model, otherwise the id will be recovered from the state
     * 
     * @param {number=null} permissionID - the permission id
     * @return {Backbone.Model} - the model of the active permission
     */
    pvt.getActivePermissionModel = function(permissionID){
        var thisView = this;
        if(typeof permissionID !== 'undefined' && permissionID !== null){
            return thisView.model.get("data").get(permissionID); 
        }else{
            return pvt.getActivePermissionModel.call(thisView, pvt.getActivePermission.call(thisView));
        }
    };
    
    /**
     * Get data to display in 'edit-user-group' area
     * @param {Model} user - the user
     * @return {user-tableL#1.pvt.getModData.groupData}
     */
    pvt.getGroupModData = function(permission){
        var thisView = this;
        
         // Get groups for this user
        var permissionGroups = new JsClass.Set(permission.get("GROUPS"));

        // Get all groups
        var allGroups = thisView.model.collection.get("groups").get("data");
        var allGroupIDs = new JsClass.Set(allGroups.map(function(d){
            return Number(d.id);
        }));

        // Get groups NOT assigned to user
        var unassignedGroups = allGroupIDs.difference(permissionGroups);

        // Set up the data
        var groupData = {
            assigned: permissionGroups.filter(function(d){
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
    
    pvt.getModifierTemplate = function(){
        if(state.has("activeRow")){
            var activeRow = state.get("activeRow");
            var activeCell = state.get("activeCell");
            switch(activeCell){
                case 0: //NAME
                case 1: //DESCRIPTION
                case 2: //PROGRAM CODE
                    return 'edit-string';
                case 3: // GROUPS
                    return 'edit-user-group';
                case 4: // DELETE
                    return 'delete-confirm';
            }
            return "unknown cell: " + activeCell;
        }else{
            return "";
        }
    };
    
    pvt.getTable = function(){
        var thisView = this;
        
        var table = {};
        
        table.headers = ["Name", "Description", "Program Code", "Groups", ""];
        table.colspan = table.headers.length;
        table.tabletitle = "Users with Selected Group";
        
        var data = thisView.model.get("data");
        
        var activeGroup = state.get("activeGroup");
        table.rows = thisView.model.get("data").filter(function(permission){
            var check = permission.get("GROUPS").find(function(d){
                return d === activeGroup;
            });
            
            if(permission.get("GROUPS").length === 0){
                permission.get("GROUPS").push(0);
            }
            
            return (typeof check !== 'undefined' || (permission.get("GROUPS").length === 1 && permission.get("GROUPS")[0] === 0));
        }).map(function(permission, j){
            
            var row = {};
            
            row.id = Number(permission.get("id"));
            row.i = j;
            row.cells = [];
            
            // Name
            row.cells.push({
                i: row.cells.length,
                textset: [{
                    i: 0,
                    v: permission.get("NAME")
                }]
            });
            
            // Type
            var dbDescription = permission.get("DESCRIPTION");
            var description = (dbDescription.trim().length > 0) ? dbDescription : "n/a";
            row.cells.push({
                i: row.cells.length,
                textset: [{
                    i: 0,
                    v: description
                }]  
            });
            
            // Program Code
            var dbCode = permission.get("PROGRAM_CODE");
            var code = (dbCode !== null && dbCode.trim().length > 0) ? dbCode : "unassigned";
            row.cells.push({
                i: row.cells.length,
                textset: [{
                    i: 0,
                    v: code
                }]
            });
            
            // Groups
            var groupCollection = thisView.model.collection.get("groups").get("data");
            var groups = permission.get("GROUPS").map(function(d){
                if(d === 0){
                    return "none";
                }else{
                    return groupCollection.get(d).get("NAME");
                }
            });
            row.cells.push({
                i: row.cells.length,
                textset: [{
                    i: 0,
                    v: groups.join(",")
                }]
            });
            
            // Delete
            row.cells.push({
                i: row.cells.length,
                textset: [{
                    i: 0,
                    v: "Delete"
                }]
            });
            
            if(state.has("activeRow") && state.get("activeRow") === j){
                row.mod = true;
                row.moddata = pvt.getModData.call(thisView, permission);
            }

            return row;
        });
        return table;
    };
    
    pvt.addUserToGroup = function(email, groupID){
        $.post(pvt.consts.ADD_USER_GROUP, {email: email, groupid: groupID}, function(ret){
            console.log(ret);
        });
    };
    
    pvt.edit = function(permissionID, options){
        var thisView = this;
        var model = pvt.getActivePermissionModel.call(thisView, permissionID); 
        
        options.pid         = permissionID;
        options.name        = (!options.name) ? model.get("NAME") : options.name;
        options.description = (!options.description) ? model.get("DESCRIPTION") : options.description;
        options.programcode = (!options.programcode) ? model.get("PROGRAM_CODE") : options.programcode;
        options.groups      = (!options.groups) ? model.get("GROUPS").join(",") : options.groups;
        
        $.post(pvt.consts.EDIT_PERMISSION, options, function(ret){
            console.log(ret);
        });
        
        model.set({
            NAME: options.name,
            DESCRIPTION: options.description,
            PROGRAM_CODE: options.programcode,
            GROUPS: options.groups.split(",").map(function(d){
                return Number(d);
            })
        });
        
        thisView.cancelEdit();
        thisView.render();
    };
    
    pvt.removeUserFromGroup = function(email, groupID){
        $.post(pvt.consts.REMOVE_USER_GROUP, {email: email, groupid: groupID}, function(ret){
            console.log(ret);
        });
    };
    
    pvt.removePermissionFromGroup = function(groupID, permissionID){
        $.post(pvt.consts.REMOVE_GROUP, {groupid: groupID, permissionid: permissionID}, function(ret){
            console.log(ret);
        });
    };
    
    return PermissionTableView;
});