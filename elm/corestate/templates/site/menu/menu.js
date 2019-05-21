define([
    "backbone", 
    "jquery", 
    "mustache",
    "text!./right-menu-template.html",
    "hub-lib"], 
function (
    Backbone, 
    $, 
    Mustache,
    Template,
    Hub) {

    var pvt = {
        consts: {
            AJAX: gRoot + "corestate/js/site/menu/ajax/update-preference.ajax.php",
            DOM_MUSTACHE: "#right-menu-template"
        }
    };

    var MenuView = Backbone.View.extend({
        template: Template,
        events: {
            "click" : "delegateClickAny",
            "click #close-menu": "delegateCloseMenu",
            "change select" : "delegateChangeMultipleChoice",
            "change input[type=checkbox]" : "delegateChangeCheckbox"
        },

        delegateChangeMultipleChoice: function (e) {
            var thisView = this;
            var $el = $(e.currentTarget);

            var id = Number($el.attr("id").split("mc-")[1]);
            var val = $el.val();
            
            var lockID = lockSite(true, "set multiple choice");

            pvt.setUserPreference.call(thisView, id, val).then(function(){
                // nothing
                lockSite(false, lockID);
            });

            return;
        },
        
        delegateClickAny: function(e){
            var thisView = this;
            thisView.model.set({
                omniSearchOpen: false
            });
        },

        delegateChangeCheckbox: function (e) {
            var thisView = this;
            var $el = $(e.currentTarget);

            var id = Number($el.attr("id").split("cb-")[1]);
            var val = ($el.prop("checked")) ? "t" : "f";
            var lockID = lockSite(true, "set checkbox");
            pvt.setUserPreference.call(thisView, id, val).then(function(){
                // nothing
                lockSite(false, lockID);
            });
        },

        delegateCloseMenu: function(e){
            var thisView = this;
            e.stopPropagation();
            thisView.model.set({
                menuOpen: false,
                omniSearchOpen: false
            });
        },

        initialize: function () {
            var thisView = this;
            Backbone.View.prototype.initialize.apply(thisView);
            thisView.$el = $(thisView.el);

            thisView.listenTo(Hub.get("user"), "add", thisView.render);
            thisView.listenTo(thisView.model, "change:menuOpen", thisView.render);

            // Get the template
            var template = thisView.template;//thisView.$el.find(pvt.consts.DOM_MUSTACHE).html();
            Mustache.parse(template);
            application.mustache.rightMenu = template;
        },

        isReady: function () {
            return true;
        },


        render: function () {
            var thisView = this;

            var table = pvt.constructTable.call(thisView);
            if(table === null){
                return;
            }

            thisView.$el.html($(Mustache.render(application.mustache.rightMenu, table)));
            
            var menuOpen = thisView.model.get("menuOpen");
            if (menuOpen) {
                thisView.$el.addClass("open");
            } else {
                thisView.$el.removeClass("open");
            }
        }
    });


    pvt.constructTable = function(){
        var thisView = this;
        //var managers = thisView.model.get("managers").managers;
        //var dataInterface = thisView.model.get("datainterface");

        var user = Hub.get("user").get(userID);//managers.fetch("user").get(userID);
        if(typeof user === "undefined"){
            return null;
        }
        
        var preferences = Hub.get("preference");
        var table = [];
        
        var groupIDs = Hub.wrap(user).groupIDs();
        var groupPreferences = groupIDs.map(function(gid){
            return Hub.get("grouppreference").where({groupid: gid}, false, Hub);
        }).reduce(function(acc, val){
            return acc.concat(val);
        }, []);
        
        // Gather the preference ids
        var preferenceIDs = groupPreferences.map(function(d){
            return d.get("preferenceid");
        });
        
        removeDuplicates(preferenceIDs);
        var userPrefs = preferenceIDs.map(function(d){
            return preferences.get(d);
        });

        for(var i = 0; i < userPrefs.length; i++){
            if(typeof userPrefs[i] === "undefined"){
                console.log("Refetching preference table.");
                Hub.get("preference").fetch({wait: true}).then(function(){
                    thisView.render();
                });
                return;
            }
        }

        userPrefs.forEach(function(preferenceModel){
            var prefName = preferenceModel.get("name");
            var prefFormType = preferenceModel.get("formtype");
            
            if(prefName === null || prefName.trim().length === 0 || prefFormType.trim().length === 0 ||  preferenceModel.get("choices") === null){
                return;
            }
            
            var prefRecord = {};
            var attrKeys = Object.keys(preferenceModel.attributes);
            attrKeys.forEach(function(key){
                prefRecord[key] = preferenceModel.get(key);
            });
            prefRecord[prefRecord["formtype"]] = true;
            prefRecord.choices = prefRecord.choices.split(",").map(function(d,index){
                var char = String.fromCharCode(97 + index);
                return {val: char, name: d};
            });

            // Get the preference record from the user
            var userPref = Hub.get("userpreference").findWhere({userid: userID, preferenceid: preferenceModel.id});
            if(userPref){
                userPref = userPref.get("val");
            }else{
                userPref = null;
            }
            //var u = user;
            //var userPref = user.getPreference(preferences, preferenceModel.id);

            if(userPref !== null){
                var choice = userPref;//(userPref.val === null ? userPref.preference.get("defaultvalue") : userPref.val);
                switch(prefRecord.formtype){

                case "mc":
                    choice = choice.charCodeAt(0);
                    var choiceIndex = choice - 97;
                    if(choiceIndex > 0 && choiceIndex < prefRecord.choices.length){
                        prefRecord.choices[choiceIndex].selected = true;
                    }
                    break;
                case "check":
                    prefRecord.checked = (choice == 't') ? true : false;
                    break;
                case "hidden":
                    /** Ignore **/
                    break;
                default:
                    throw Error("unknown formtype: " + prefRecord.formType);
                    //break;
                }
                
            }
            table.push(prefRecord);

        });

        return {preferences: table};
    }

    /**
     * Set the user preference and save the record to the server
     * 
     * @param {number} id - the preference id
     * @param {string} value - the value of the preference
     * @return {Promise}
     */
    pvt.setUserPreference = function(id, value){
        var thisView = this;
        var chain = Promise.resolve();
        var ob = {
            preferenceid: id,
            userid: userID,
            val: value
        };
        
        // Get the current preference if it exists
        var userpref = Hub.get("userpreference").findWhere({userid: userID, preferenceid: id});
        if(userpref){
            var old = userpref.toJSON();
            
            // Update existing preference setting
            return userpref.save(ob, {wait:true});
        }
        
        // Create existing preference setting
        return Hub.get("userpreference").create(ob, {wait:true});
    };


    return MenuView;
});