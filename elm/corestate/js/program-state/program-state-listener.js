/* global appstate, approuter, application */

define(["backbone", "hub-lib", "constants"], 
function(Backbone, Hub, cnst){
    var pvt = {};
    var Listener = Backbone.View.extend({
        events: {},
        
        /**
         * Initialize the view
         */
        initialize:function(options){
            var thisView = this;
            var appstate = options.appstate;
            
            thisView.model = new Backbone.Model({
                id: "program-state-listener-model",
                updateCnt: 0
            });
            
            thisView.listenTo(Hub.get("userpreference"), "add", pvt.delegateUserChanged);
            thisView.listenTo(Hub.get("userpreference"), "change", pvt.delegateUserChanged);
            thisView.listenTo(Hub.get("preference"), "add", pvt.delegatePreferenceLoaded);
            //thisView.listenTo(Hub.get("preference"), "update", pvt.delegatePreferenceLoaded);
            
            //thisView.listenTo(appstate, "change:activeSubject", pvt.delegateUpdateDataInterface);
            //thisView.listenTo(appstate, "change:activeSet", pvt.delegateUpdateDataInterface);
            thisView.listenTo(appstate, "change", pvt.delegateChange);
            thisView.listenTo(appstate, "update", pvt.delegateChange);
        },
        
        toJSON: function(){
            return {};
        },
        
        toUrl(){
            return pvt.getUrl();
        }
    });
    
    pvt.delegatePreferenceLoaded = function(model, options){
        var thisView = this;
        var code = model.get("program_code");
        switch(code){
            case "SUBJECT":
                if(appstate.get("activeSubject") === null){
                    // Load the default subject
                    var choice = (model.get("defaultvalue").charCodeAt(0)) - ("a".charCodeAt(0));
                    var options = model.get("choices").split(",");
                    var selected = options[choice];
                    appstate.set("activeSubject", selected.toLowerCase());
                }
                break;
            case "SSET":
                if(appstate.get("activeSet") === null){
                    // Load the default set
                    var choice = (model.get("defaultvalue").charCodeAt(0)) - ("a".charCodeAt(0));
                    var options = model.get("choices").split(",");
                    var selected = options[choice];
                    appstate.set("activeSet", selected.toLowerCase());
                }
                break;
        }
        
        // Are there any user preferences associated?
        var userPrefs = Hub.get("userpreference").where({preferenceid: model.id});
        if(userPrefs.length > 0){
            userPrefs.forEach(function(userpref){
                pvt.delegateUserChanged.call(thisView, userpref);
            });
        }
    },
    
    pvt.delegateUserChanged = function(model, options){
        var thisView = this;
        assertExists(model, "model should exist");
        if(Hub.get("preference").length === 0){
            return;
        }
        
        if(model.get("userid") === userID){
            var matches = Hub.get("preference").where({preferenceid: model.get("preferenceid")});
            if(matches.length === 0){
                // Ignore
                return;
            }
            
            assert(matches.length === 1);
            
            var pref = matches[0];
            var code = pref.get("program_code");
            
            switch(code){               
                case "SUBJECT":
                    var pref = getPreferenceFromHub(code, Hub);
                    appstate.set("activeSubject", pref.toLowerCase());
                    break;
                case "SSET":
                    if(Hub.get("loaded") === true){
                        localStorage.clear();
                        //var pref = getPreferenceChoiceFromHub(code, Hub);                        
                        //Hub.sendUserNotification("Changing standard set.");
                        //var lockID = lockSite(true, "program-state-listener.js::pvt.delegateUserChanged");
                        //appstate.set("activeSet", pref.toLowerCase());
                        
                        //return Hub.selectSet(pref.toLowerCase()).then(function(){
                            window.location = window.location.origin + window.location.pathname;
                            //lockSite(false, lockID);
                        //});
                    }
                    
                    break;
            }
        }
    };
    
    /*pvt.delegateUpdateDataInterface = function(model, options){
        var thisView = this;
        var appstate = model;
        
        var activeSubject = appstate.get("activeSubject");
        var activeSet = appstate.get("activeSet");
        
        if(activeSet !== null){
            
            // Get the set id
            if(!$.isNumeric(activeSet)){
                var setModel = Hub.get("set").find(function(d){
                    return (d.get("name").toLowerCase() === activeSet);
                });
                assertDefined(setModel, "could not find set model for set with name: " + activeSet);
                activeSet = setModel.id;
            }
            
            if(activeSubject !== null){
                // Get the subject id
                if(!$.isNumeric(activeSubject)){
                    var subjectModel = Hub.get("subject").find(function(d){
                        return (d.get("name").toLowerCase() === activeSubject);
                    });
                    if(subjectModel){
                        activeSubject = subjectModel.id;
                    }else{
                        activeSubject = null;
                    }
                }
            }
            
            
            return datainterface.load(userID, {setid: activeSet, subjectid: activeSubject, ignorefab: true}).then(function(){
                if(activeSubject === null && appstate.get("activeSubject") !== null){
                    return pvt.delegateUpdateDataInterface(appstate, options);
                }
            });
        }
    };*/
    
    pvt.delegateChange = function(model, options){
        var thisView = this;
        var cnt = thisView.model.get("updateCnt") + 1;
        thisView.model.set("updateCnt", thisView.model.get("updateCnt") + 1);
        
        setTimeout(function(){
            var timeNow = thisView.model.get("updateCnt");
            if(cnt === timeNow){
                // Reset the count
                thisView.model.set("updateCnt", 0);
                
                var url = pvt.getUrl.call(thisView);
                approuter.navigate(url);
            }
        }, 500);
    };
    
    /**
     * Get the url variables for the current state.
     * @return {string} - the url variables.
     */
    pvt.getUrl = function(){
        var stream = [];
        
        // Filter out base terms
        Object.keys(appstate.attributes).forEach(function(d){
            // Ignore the listener & id
            if(d === "listener" || d === "id" || d === "userID" || d === "telemetryStack"){
                return;
            }
            
            if(appstate.get(d) !== null){
                var type = typeof(appstate.get(d));
                var json = null;
                switch(type){
                    case "number":
                        type = "n";
                        json = appstate.get(d).toString();
                        break;
                    case "string":
                        type = "s"; 
                        json = appstate.get(d);
                        break;
                    case "object":
                    case "boolean":
                        if(appstate.get(d).hasOwnProperty("models")){
                            type = "c";
                            json = JSON.stringify(appstate.get(d).toJSON());
                        }else{
                            type = "o"; 
                            json = JSON.stringify(appstate.get(d));
                        }
                        break;
                    default:
                        throw Error("Unrecognized type: " + type);
                }

                if(json.trim().length > 0){
                    if(d === "activeGraph"){
                        json = application.graphstate.toUrl();
                    }
                    json = json
                            .replaceAll(":", "[c]")
                            .replaceAll("\"", "[q]")
                            .replaceAll("[q][c]", "[qc]")
                            .replaceAll("[c][q]", "[cq]");
                    
                    var typeD = [type,d].join(":");
                    if(cnst.STATE_VARIABLES.hasOwnProperty(typeD)){
                        stream.push([cnst.STATE_VARIABLES[typeD],json].join(":"));
                    }else{
                        console.log("unknown state parameter: " + typeD);
                        stream.push([type,d,json].join(":"));
                    }
                }
            }
        });
        
        return stream.join("&");
    };
    
    return Listener;
});
