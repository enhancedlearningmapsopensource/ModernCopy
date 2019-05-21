define([
    "backbone", 
    "../search/search-model",
    "../logo/logo-model",
    "../navbar-dropdown-button/navbar-dropdown-button-model"
], 
function(
    Backbone,
    SearchModel,
    LogoModel,
    DropdownModel
){
    var pvt = {
        consts:{
            PATH_LOGOUT: gRoot + "login/logout.php"
        }
    };         
    var Model = Backbone.Model.extend({
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisModel = this;
            thisModel.set({
                "modeltype": "bar",
                "search": new SearchModel(),
                "logo": new LogoModel({
                    "id": "logo-model"
                }),
                "help": new DropdownModel({
                    "id": "help-model",
                    "name": "Help",
                    "items": [{
                        "name": "User Guide",
                        "overlay": "userguide"
                    },{
                        "name": "Dashboard",
                        "overlay": "dashboard"
                    },{
                        "name": "Videos",
                        "overlay": "videos"
                    }]
                }),
                "profile": new DropdownModel({
                    "id": "profile-model",
                    "items": [{
                        "name": "Logout",
                        "action": function(){
                            window.location = pvt.consts.PATH_LOGOUT;
                        }
                    },{
                        "name": "Preferences",
                        "action": function(){
                            appstate.set("menuOpen", false);
                            appstate.set("menuOpen", true);
                        }
                    }]
                }),
                "window": new DropdownModel({
                    "id": "window-model",
                    "name": "Map"
                })
            });
        },
        
        /**
         * Render the view
         */
        parse:function(data){
            var thisModel = this;
        }
    });
    return Model;
});