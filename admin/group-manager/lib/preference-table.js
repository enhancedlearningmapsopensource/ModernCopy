define(["jsclass!admin-main/js-class-require/","lib/table", "mustache"], function(JsClass, TableView, Mustache){
    var pvt = {
        consts: {
            AJAX_PATH: gRoot + "admin/group-manager/ajax/"
        }
    };
    pvt.consts.REMOVE_USER_GROUP    = pvt.consts.AJAX_PATH + "remove-user-from-group.php";
    pvt.consts.ADD_USER_GROUP       = pvt.consts.AJAX_PATH + "add-user-to-group.php";
    pvt.consts.ADD_GROUP            = pvt.consts.AJAX_PATH + "add-preference-to-group.php";
    pvt.consts.DELETE               = pvt.consts.AJAX_PATH + "delete-preference.php";
    pvt.consts.CREATE_PREFERENCE    = pvt.consts.AJAX_PATH + "create-preference.php";
    pvt.consts.REMOVE_GROUP         = pvt.consts.AJAX_PATH + "remove-preference-from-group.php";
    pvt.consts.EDIT                 = pvt.consts.AJAX_PATH + "edit-preference.php";
    
    var UserTableView = TableView.extend({
        
        events:{
            "click .assigned" : "clickAssigned",
            "click .avaliable" : "clickAvaliable",
            "click #ok-new-row" : "createNewPreference",
            "click #name-ok" : "editName",
            "click #type-ok" : "editType",
            "click #choices-ok" : "editChoices",
            "click #default-ok" : "editDefault",
            "click #programcode-ok" : "editProgramCode",
            "click #delete-preference > .delete-ok" : "deletePreference",
            "click .cancel-edit" : "cancelEdit"
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
                
                // Get the preference id
                var activeRow = state.get("activeRow");
                var tableData = thisView.model.get("displayed").tables[0].rows[activeRow];
                var preferenceID = tableData.id;
                
                pvt.removePreferenceFromGroup(groupID, preferenceID);
                
                // Get the permission object
                var preference = thisView.model.get("data").get(preferenceID);
                var groups = new JsClass.Set(preference.get("GROUPS").map(function(d){return d;}));
                groups.remove(groupID);
                if(groups.length === 0){
                    groups.add(0);
                }
                
                var newGroups = groups.map(function(d){return d;});
                preference.set("GROUPS", newGroups);
                
                $el.parents("td").html(Mustache.render(thisView.model.get("edit-user-group"), {
                    moddata: pvt.getGroupModData.call(thisView, preference)
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
                
                // Get the preference id
                var prefID = pvt.getActiveID.call(thisView);
                
                pvt.addPreferenceToGroup(prefID, groupID);
                
                // Get the preference object
                var preference = thisView.model.get("data").get(prefID);
                var groups = new JsClass.Set(preference.get("GROUPS").map(function(d){return d;}));
                groups.add(groupID);
                groups.remove(0);
                
                var newGroups = groups.map(function(d){return d;});
                preference.set("GROUPS", newGroups);
                
                $el.parents("td").html(Mustache.render(thisView.model.get("edit-user-group"), {
                    moddata: pvt.getGroupModData.call(thisView, preference)
                }));
            }
        },
        
        createNewPreference: function(e){
            var thisView = this;
            var $form = $("#new-preference-form");
            var name = $form.find("#name").val();
            if(name.trim().length > 0){
                pvt.createPreference.call(thisView, name);
            }
        },
        
        deletePreference: function(e){
            var thisView = this;
            
            // Get the active permission id
            var permissionID = pvt.getActiveID.call(thisView);
            
            // Delete the permission
            pvt.deletePreference.call(thisView, permissionID);
            
            // Refresh
            thisView.render();
        },
        
        /**
         * Apply change to name
         */
        editName: function(e){
            var thisView = this;
            var name = thisView.$el.find("#edit-name-string").find("#name").val();
            
            var prefID = pvt.getActiveID.call(thisView);      
            if(name.trim().length > 0){
                pvt.edit.call(thisView, prefID, {name: name});
            }
        },
        
        /**
         * Apply change to type
         */
        editType: function(e){
            var thisView = this;
            var type = thisView.$el.find("#edit-type-string").find("#type").val();
            
            var prefID = pvt.getActiveID.call(thisView);      
            if(type.trim().length > 0){
                pvt.edit.call(thisView, prefID, {type: type});
            }
        },
        
        /**
         * Apply change to type
         */
        editChoices: function(e){
            var thisView = this;
            var choices = thisView.$el.find("#edit-choices-string").find("#choices").val();
            
            var prefID = pvt.getActiveID.call(thisView);      
            if(choices.trim().length > 0){
                pvt.edit.call(thisView, prefID, {choices: choices});
            }
        },
        
        /**
         * Apply change to type
         */
        editDefault: function(e){
            var thisView = this;
            var defaultVal = thisView.$el.find("#edit-default-string").find("#default").val();
            
            var prefID = pvt.getActiveID.call(thisView);      
            if(defaultVal.trim().length > 0){
                pvt.edit.call(thisView, prefID, {default: defaultVal});
            }
        },
        
        /**
         * Apply change to program code
         */
        editProgramCode: function(e){
            var thisView = this;
            var code = thisView.$el.find("#edit-programcode-string").find("#programcode").val();
            
            var prefID = pvt.getActiveID.call(thisView);      
            if(code.trim().length > 0){
                pvt.edit.call(thisView, prefID, {programcode: code});
            }
        },
        
        
        initialize: function(){
            var thisView = this;
            TableView.prototype.initialize.call(thisView);
            thisView.addTemplate("edit-user-group");
            thisView.addTemplate("new-permission");
            thisView.addTemplate("edit-string");
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
                
                thisView.$el.find("div:first").append(Mustache.render(thisView.model.get("new-permission"), {type: "preference"}));
            }
            
            
        }
    });
    
    pvt.getModifierTemplate = function(){
        if(state.has("activeRow")){
            var activeRow = state.get("activeRow");
            var activeCell = state.get("activeCell");
            switch(activeCell){
                case 0: //NAME
                case 1: //TYPE
                case 2: //CHOICES
                case 4: // PROGRAM_CODE
                case 3: // DEFAULT
                    return 'edit-string';
                case 5: // GROUPS
                    return 'edit-user-group';
                case 6: // DELETE
                    return 'delete-confirm';
            }
            return "unknown cell: " + activeCell;
        }else{
            return "";
        }
    };
    
    pvt.deletePreference = function(preferenceID){
        var thisView = this;
        $.post(pvt.consts.DELETE, {preferenceid: preferenceID}, function(ret){
            console.log(ret);
            
            var tableData = thisView.model.get("data");
            tableData.remove(preferenceID);
            
            state.set({
                activeRow: null,
                activeCell: null
            });
            thisView.render();
        });
    };
    
    pvt.edit = function(id, options){
        var thisView = this;
        var model = pvt.getActiveModel.call(thisView, id); 
        
        options.pid         = id;
        
        var defaults = {
            name: "NAME",
            type: "FORMTYPE",
            choices: "CHOICES",
            programcode: "PROGRAM_CODE",
            default: "DEFAULTVALUE"   
        };
        
        Object.keys(defaults).forEach(function(d){
            options[d] = (!options[d]) ? model.get(defaults[d]) : options[d];
        });
        
        //options.name        = (!options.name) ? model.get("NAME") : options.name;
        //options.type        = (!options.type) ? model.get("TYPE") : options.type;
        //options.choices     = (!options.type) ? model.get("CHOICES") : options.type;
        //options.programcode = (!options.programcode) ? model.get("PROGRAM_CODE") : options.programcode;
        options.groups      = (!options.groups) ? model.get("GROUPS").join(",") : options.groups;
        
        $.post(pvt.consts.EDIT, options, function(ret){
            console.log(ret);
        });
        
        var setData = {};
        Object.keys(defaults).forEach(function(d){
            setData[defaults[d]] = options[d];
        });
        setData.GROUPS = options.groups.trim().length === 0 ? [] : options.groups.split(",").map(function(d){
            return Number(d);
        });
        
        model.set(setData);
        
        thisView.cancelEdit();
        thisView.render();
    };
    
    /**
     * Get the active permission
     * @return {number} - the id of the active permission
     */
    pvt.getActiveID = function(){
        var thisView = this;
        
        var activeRow = state.get("activeRow");
        var tableData = thisView.model.get("displayed").tables[0].rows[activeRow];
        var prefID = tableData.id;
        if(!$.isNumeric(prefID)){
            throw Error("Permission id is invalid: " + prefID);
        }
        
        return prefID;
    };
    
    /**
     * Gets the active model. If the id is provided then it will
     * be used to get the model, otherwise the id will be recovered from the state
     * 
     * @param {number=null} id - the id
     * @return {Backbone.Model} - the model of the active row
     */
    pvt.getActiveModel = function(id){
        var thisView = this;
        if(typeof id !== 'undefined' && id !== null){
            return thisView.model.get("data").get(id); 
        }else{
            return pvt.getActiveModel.call(thisView, pvt.getActiveID.call(thisView));
        }
    };
    
    /**
     * Get data to display in 'edit-user-group' area
     * @param {Model} user - the user
     * @return {user-tableL#1.pvt.getModData.groupData}
     */
    pvt.getGroupModData = function(preference){
        var thisView = this;
        
         // Get groups for this user
        var preferenceGroups = new JsClass.Set(preference.get("GROUPS"));

        // Get all groups
        var allGroups = thisView.model.collection.get("groups").get("data");
        var allGroupIDs = new JsClass.Set(allGroups.map(function(d){
            return Number(d.id);
        }));

        // Get groups NOT assigned to user
        var unassignedGroups = allGroupIDs.difference(preferenceGroups);

        // Set up the data
        var groupData = {
            assigned: preferenceGroups.filter(function(d){
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
     * Get data to display in 'edit-user-group' area
     * @param {Model} user - the user
     * @return {user-tableL#1.pvt.getModData.groupData}
     */
    pvt.getModData = function(preference){
        var thisView = this;
        
        var activeCell = state.get("activeCell");
        switch(activeCell){
            case 0: //NAME
                return {
                    name: "Name",
                    txtid: "name",
                    value: preference.get("NAME")
                };
            case 1: //TYPE
                return {
                    name: "Type",
                    txtid: "type",
                    value: preference.get("FORMTYPE")
                };
            case 2: //CHOICES
                return {
                    name: "Choices",
                    txtid: "choices",
                    value: preference.get("CHOICES")
                };
            case 4: // PROGRAM_CODE
                return {
                    name: "Program Code",
                    txtid: "programcode",
                    value: preference.get("PROGRAM_CODE")
                };
            case 3: // DEFAULT
                return {
                    name: "Default",
                    txtid: "default",
                    value: preference.get("DEFAULTVALUE")
                };
            case 5: // GROUPS
                return pvt.getGroupModData.call(thisView, preference);
            case 6: // DELETE
                return {
                    msg: "Are you sure you want to delete the permission '"+preference.get("NAME")+"'. This action cannot be undone.",
                    id: 'preference'
                };
            
            /*case 0: // NAME
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
                };*/
        }
    }
    
    pvt.getTable = function(){
        var thisView = this;
        
        var table = {};
        
        table.headers = ["Name", "Type", "Choices", "Default", "Program Code", "Groups", ""];
        table.colspan = table.headers.length;
        table.tabletitle = "Users with Selected Group";
        
        var data = thisView.model.get("data");
        
        var activeGroup = state.get("activeGroup");
        
        table.rows = thisView.model.get("data").filter(function(pref){
            var show = ($.inArray(activeGroup, pref.get("GROUPS")) > -1 || (pref.get("GROUPS").length === 0));
            return (show && pref.get("FORMTYPE") !== null);
        }).map(function(pref, j){
            
            var row = {};
            row.id = Number(pref.get("id"));
            row.i = j;
            row.cells = [];
            
            // Name
            row.cells.push({
                i: row.cells.length,
                textset: [{
                    i: 0,
                    v: pref.get("NAME")
                }]
            });
            
            // Type
            var type = (pref.get("FORMTYPE").localeCompare("mc") === 0) ? "Multiple Choice" : "True/False";
            row.cells.push({
                i: row.cells.length,
                textset: [{
                    i: 0,
                    v: type
                }]
            });
            
            // Name
            var choices = (pref.get("FORMTYPE").localeCompare("mc") === 0) ? pref.get("CHOICES").split(",") : ["True","False"];
            row.cells.push({
                i: row.cells.length,
                textset: [{
                    i: 0,
                    v: choices.join(",")
                }]
            });
            
            // Default
            var defaultChar = pref.get("DEFAULTVALUE");
            if(pref.get("FORMTYPE").localeCompare("mc") === 0){
                var charAscii = defaultChar.charCodeAt(0) - "a".charCodeAt(0);
            }else{
                var charAscii = (defaultChar.localeCompare("t") === 0) ? 0 : 1;
            }
            var defaultVal = choices[charAscii];
            row.cells.push({
                i: row.cells.length,
                textset: [{
                    i: 0,
                    v: defaultVal + "("+defaultChar+")"
                }]
            });
            
            // Program Code
            var dbCode = pref.get("PROGRAM_CODE");
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
            var groups = pref.get("GROUPS").map(function(d){
                if(d === 0){
                    return "none";
                }else{
                    return groupCollection.get(d).get("NAME");
                }
            });
            groups = groups.length == 0 ? ["none"] :  groups;
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
            
            
                /*i: j,
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
            };*/

            /*if(state.has("activeRow") && state.get("activeRow") === j){
                row.mod = true;
                row.moddata = pvt.getModData.call(thisView, user);
            }*/
        
            if(state.has("activeRow") && state.get("activeRow") === j){
                row.mod = true;
                row.moddata = pvt.getModData.call(thisView, pref);
            }

            return row;
        });
        return table;
    };
    
    /*pvt.addUserToGroup = function(email, groupID){
        $.post(pvt.consts.ADD_USER_GROUP, {email: email, groupid: groupID}, function(ret){
            console.log(ret);
        });
    };*/
                                            
    pvt.addPreferenceToGroup = function(preferenceID, groupID){
        $.post(pvt.consts.ADD_GROUP, {preferenceid: preferenceID, groupid: groupID}, function(ret){
            console.log(ret);
        });
    };
    
    pvt.createPreference = function(name){
        var thisView = this;
        $.post(pvt.consts.CREATE_PREFERENCE, {name: name}, function(ret){
            var newPref = JSON.parse(ret);
            
            var tableData = thisView.model.get("data");
            tableData.add(newPref);
            
            thisView.$el.find("#new-permission-form").removeClass("open");
            thisView.$el.find("#new-row").removeClass("closed");
            thisView.render();
        });
    };
    
    pvt.removePreferenceFromGroup = function(groupID, preferenceID){
        $.post(pvt.consts.REMOVE_GROUP, {groupid: groupID, preferenceid: preferenceID}, function(ret){
            console.log(ret);
        });
    };
    
    
    
   
    
    return UserTableView;
});