define(["core",
        "mustache",
        "text!./default.php",
        "../search/search",
        "../search-closed/search-closed",
        "../logo/logo",
        "../navbar-dropdown-button/navbar-dropdown-button", 
        "hub-lib"], 
function(Core,
         Mustache,
         Template,
         Search,
         SearchClosed,
         LogoView,
         NavbarDropdown,
         Hub){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            // Create search & search closed
            thisView.add("search-view", new Search({
                id: "search-view",
                model: thisView.model.get("search")
            })).render();
            
            // Create logo
            thisView.add("logo-view", new LogoView({
                id: "logo-view",
                model: thisView.model.get("logo")
            })).render();
            
            // Create dropdowns
            ["help", "window", "profile"].forEach(function(d){
                thisView.addToGroup("dropdowns", new NavbarDropdown({
                    id: d,
                    model: thisView.model.get(d)
                }), d).render();
            });
            
            // Add action response to "Map/Standard" trigger button
            thisView.get("dropdowns", "window").model.set("action", pvt.toggleWindow);
            
            // Listen for users - need to fill profile button
            thisView.listenTo(Hub.get("user"), "add", pvt.addUser);
            
            // Listen for changes to active graph to show/hide the standard/map button
            thisView.listenTo(appstate, "change:activeGraph", thisView.render);
            
            // Listen for changes to the active window to toggle the standard/map button
            thisView.listenTo(appstate, "change:activeWindow", thisView.render);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {};
            
            thisView.get("search-view").$el.detach();
            thisView.get("logo-view").$el.detach();
            var buttonViews = thisView.detachGroup("dropdowns");
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            var $middleCol = thisView.$el.find("#middle-column");
            
            $middleCol.append(thisView.get("search-view").$el);
            
            thisView.$el.find("#left-column > #upper-row").append(thisView.get("logo-view").$el);
            
            var $rightCol = thisView.$el.find("#right-column");
            
            // Reattach help button
            $rightCol.append(thisView.get("dropdowns","help").$el);
            
            // Reattach window button
            // Set the value of the Map/Standards button
            var activeWindow = appstate.get("activeWindow");
            if (activeWindow === "standard") {
                var graphState = application.graphstate;
                if (graphState._stash.length > 0) {
                    var windowButtonView = thisView.get("dropdowns","window");
                    windowButtonView.model.set("name", "Map");
                    $rightCol.append(windowButtonView.$el);
                }                
            } else if (activeWindow === "graph") {
                var windowButtonView = thisView.get("dropdowns","window");
                windowButtonView.model.set("name", "Standards");
                $rightCol.append(windowButtonView.$el);
            }else{
                throw Error("Unknown window: " + activeWindow);
            }
            
            // Reattach profile button
            $rightCol.append(thisView.get("dropdowns","profile").$el);
        }
    });
    
    pvt.addUser = function(model){
        var thisView = this;
        if(model.id === userID){
            var standardSetPref = getPreference("SSET", hub);
            thisView.get("dropdowns", "profile").model.set({
                "name": model.get("email"),
                "sub": "(" + standardSetPref + ")"
            });
        }
    };
    
    pvt.toggleWindow = function(){
        var thisView = this;
        var activeWindow = appstate.get("activeWindow");
        if(activeWindow === "graph"){
            appstate.set("activeWindow", "standard");
        }else if(activeWindow === "standard"){
            appstate.set("activeWindow", "graph");
        }else{
            throw Error("Unknown window: " + activeWindow);
        }
    };
    
    return View;
});
