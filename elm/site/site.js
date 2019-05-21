/* global lockSite, application, ActiveGraph, appstate */


/**
 * Main View presiding over the site
 */
define([    
    "backbone",
    "underscore",
    "activeGraph",
    "navbar-lib",
    //"corestate/templates/site/navbar/main/navbar-view",
    "corestate/templates/site/menu/menu",
    "corestate/templates/site/context-menu/context-menu-view",
    "corestate/templates/site/overlays/main/overlay",
    "standards-page",
    "corestate/templates/site/windows/graph/main/graph-window",
    //"corestate/templates/site/main/resource-manager-interface",
    "hub-lib",
    "search-engine-lib",
    "corestate/edit-mode-warning-screen/edit-mode-warning-screen",
    "text!./site.php",
    "mustache"],
function (  
    Backbone,
    _,
    ActiveGraph,
    NavBarView,
    Menu,
    ContextMenu,
    OverlayView,
    StandardsWindowView,
    GraphWindowView,
    //ResourceManagerInterface,
    Hub,
    SearchEngine,
    EditModeWarning,
    Template,
    Mustache
) {

    var pvt = {
        consts: {
            DOM_NAVBAR: "#fixed > #nav-bar",
            DOM_NAVBAR_MOBILE: "#fixed > #nav-bar-mobile",
            DOM_WINDOW_STANDARDS: "#standards-window",
            DOM_WINDOW_GRAPH: "#graph-window",
            DOM_MENU: "#preference-menu",
            DOM_CONTEXT_MENU: "#context-menu",
            DOM_OVERLAY: "#overlays",
            DOM_RESOURCE: ".resource-manager-area"
        }
    };

    var SiteView = Backbone.View.extend({
        template: Template,
        events:{
            "keyup" : "delegateKeyPress",
            "mousedown" : "delegateClick"
        },
        
        delegateClick: function(e){
            // Notify the navigation bar
            var thisView = this;
            thisView.model.get("navbar").get("search").set("open", false);
            thisView.model.get("navbar").get("profile").set("open", false);
            thisView.model.get("navbar").get("help").set("open", false);
            return true;
        },
        
        /**
         * Create a graph window view from the given view template
         * @param {Backbone.View} view - the view template
         * @return {Promise}
         */
        /*createGraphWindow: function(view){
            var thisView = this;
            var instance = new view({ id: "graph-window-view", model: thisView.model, el: thisView.$el.find(pvt.consts.DOM_WINDOW_GRAPH)[0] });
            thisView.model.get("views").graphWindow = instance;
            
            return instance.checkPreloadedSidePanel()
                .then(_.bind(instance.load, instance));
        },*/

        delegateKeyPress: function(e){
            var thisView = this;
            var key = e.key;
            if(key === "Escape"){
                // Toggle the escape key
                appstate.set("escapedown", true);
                appstate.set("escapedown", false);
            }
        },
        
        delegateStandardClicked: function(model, options){
            var thisView = this;
            var sid = appstate.get("standardClicked");
            if(sid === null){
                return;
            }
            
            var lockID = lockSite(true, "site.js::delegateStandardClicked");
            var activeSet = appstate.get("activeSet");
            var activeSubject = appstate.get("activeSubject");
            
            // Reset the clicked standard
            appstate.set("standardClicked", null);
            var result = SearchEngine.search({
                value: sid
            });
            
            assert(result.length === 1);

            // Isolate the standard
            let standard = null;

            // Check to see if there are multiple matches (e.g. RL.6.1 & RL.6.10)
            if(result[0].standard.matches.length === 1){
                standard = Hub.get("simplestandard").get(result[0].standard.matches[0]);
            }else{
                standard = result[0].standard.matches
                    // Get the standard models
                    .map(function(d){
                        return Hub.get("simplestandard").get(d);
                    })
                    // Find the matching standard model (or the first one)
                    .find(function(d){
                        return d.get("textid") === options;
                    });
                assertDefined(standard);
            }

            // Get nodes for the standard
            var nodeIDs = Hub.wrap(standard).nodeIDs();
            
            // Open a blank graph
            return ActiveGraph.set(thisView.model, "_" + sid, {update: false, close: true}).then(function(){
                var graphManager = application.graphstate;
                var graphDef = graphManager.get();
                graphDef.graphID = "_" + sid;

                // Add necessary nodes
                nodeIDs.forEach(function(nodeID){
                    if(Hub.get("node").has(nodeID)){
                        graphDef.setNodeColor(nodeID, "red");
                    }
                });

                // Update the program
                graphManager.set(graphDef);
                graphManager.apply({activeWindow: "graph", omniSearchOpen: false});

                // Since the graph has changed, remove the search results
                thisView.model.set("prevResult", null);
                lockSite(false, lockID);
            });
        },

        

        getGraphAreaEl: function(){
            var thisView = this;
            return thisView.model.get("views").graphWindow.getGraphAreaEl();
        },

        initialize: function () {
            var thisView = this;
            Mustache.parse(thisView.template);
            Backbone.View.prototype.initialize.apply(thisView);

            //thisView.$el = $(thisView.el);
            //thisView.model = new Backbone.Model({id: 'site-model'});
            
            // Set up the navbar
            var navbarView = NavBarView.create({id: "navbar-view"});
            navbarView.render();
            application.views.navbar = navbarView;
            thisView.model.set("navbar", navbarView.model);

            
            
            // Set up windows
            var standardWindowView = new StandardsWindowView({ id: "standards-window-view"});
            standardWindowView.render();
            application.views.standardWindow = standardWindowView;
            
            var graphWindowView = new GraphWindowView({ id: "graph-window-view"});
            graphWindowView.render();
            application.views.graphWindow = graphWindowView;
            
            var editModeWarningView = new EditModeWarning({ id: "edit-mode-warning-view"});
            editModeWarningView.render();
            application.views.editModeWarning = editModeWarningView;
            
            //pvt.setUpNavbar.call(thisView);
          
            // Set up the context menu
            new ContextMenu({ id: "context-menu", el: thisView.$el.find(pvt.consts.DOM_CONTEXT_MENU)[0] });
            application.views.menu = new Menu({ id: "menu-view", model: appstate, el: thisView.$el.find(pvt.consts.DOM_MENU)[0] });
            application.views.menu.render();
            
            application.views.mainoverlay = new OverlayView({id: "overlay-view", model: appstate, el: thisView.$el.find(pvt.consts.DOM_OVERLAY)[0]});
            
            /*application.views.overlays.forEach(function(d){
                d.render();
            });*/
            
            
            if(typeof ResourceManager !== "undefined"){
                // Set up the resource manager
                var resManager = new ResourceManager({
                    datainterface: Hub,
                    id: "resource-manager", 
                    el: thisView.$el.find(pvt.consts.DOM_RESOURCE)[0]
                });
                
                // Set up the resource manager interfacer
                (new ResourceManagerInterface({
                    id: "resource-manager-interface",
                    resourcemanager: resManager
                }));
            }            

            thisView.listenTo(appstate, "change:activeWindow", thisView.render);
            thisView.listenTo(appstate, "change:activeSubject", thisView.render);
            thisView.listenTo(appstate, "change:standardClicked", thisView.delegateStandardClicked);
            thisView.listenTo(appstate, "change:standardselected", thisView.delegateStandardSelected);
            thisView.listenTo(appstate, "change:sidePanel", thisView.render);
            thisView.listenTo(application.views.editModeWarning.model, "change:visible", thisView.render);
            //thisView.listenTo(thisView.model, "change:locked", thisView.render);
            thisView.listenTo(thisView.model, "change:message", thisView.render);
            
        },

        /**
         * Locks/unlocks the site, preventing/allowing user input
         * @param {bool} lockOn - locks/unlocks the site
         */
        lock: function(lockOn, animate){
            var thisView = this;
            if(typeof animate === "undefined" || animate === null){
                animate = true;
            }
            
            var $lockScreen = $("#lockscreen");
            if(lockOn){
                console.log("Locking screen.");
                thisView.$el.addClass("locked");
                thisView.model.set("locked", true);
                
            }else{
                console.log("Unlocking screen.");
                thisView.$el.removeClass("locked");
                thisView.model.set("locked", false);
            }
        },
        
        notifyUser: function(message){
            var thisView = this;
            thisView.model.set("message", message);
        },
        
        print: function(header, content){
            var $printDiv = $("#print-div");
            $printDiv.hide();
            $printDiv.removeClass("visible-print-block");
            
            var $printReplace = $("#print-replace");
            $printReplace.addClass("visible-print-block");
            $printReplace.show();
            $printReplace.html("");
            
            if(typeof header === "string" && header !== null && header.trim().length > 0){
                $printReplace.append("<h3>"+header+"</h3>");
            }
            $printReplace.append(content);
            
            
            //$("#print-replace").find("table").before("<h3>"+header+" Node Table</h3>");
            window.print();
        },

        /**
         * Render the view
         */
        render: function () {
            var thisView = this;
            var views = [];
            var renderOb = {
                locked: thisView.model.get("locked"),
                message: thisView.model.get("message")//,
                //roster: appstate.get("sidePanel") === Constants.STRINGS.ROSTER
            };
            
            application.contextmenu.$el.detach();
            application.views.navbar.$el.detach();
            application.views.standardWindow.$el.detach();
            application.views.graphWindow.$el.detach();
            application.views.editModeWarning.$el.detach();
            application.views.mainoverlay.$el.detach();
            application.views.menu.$el.detach();

            // Notify listeners of the pending render
            //appstate.set("siterender", timeNow());
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            // Reattach navbar
            thisView.$el.find(".navbar-area").html(application.views.navbar.$el);
            
            // Reattach overlays
            thisView.$el.find("#overlay").append(application.views.mainoverlay.$el);
            
            // Add context menu
            thisView.$el.find("#fixed").append(application.contextmenu.$el);
            
            // Reattach menu
            thisView.$el.find("#fixed").append(application.views.menu.$el);
            
            // Render active window
            var $mainArea = thisView.$el.find(".main-window-area");
            var activeWindow = appstate.get("activeWindow");
            
            if(activeWindow === "standard"){
                $mainArea.html(application.views.standardWindow.$el);
            }else if(activeWindow === "graph"){
                $mainArea.html(application.views.graphWindow.$el);
            }
            
            if(application.views.editModeWarning.model.get("visible") === true){
                $mainArea.append(application.views.editModeWarning.$el);
            }
        },
        
        searchNode(textid){
            // Search using the term
            var result = SearchEngine.search({
                value: textid
            });
            
            // Gather node ids
            var nodeIDs = result.reduce(function(acc,val){
                return acc.concat(val.node.matches);
            },[]);
            
            // Remove duplicates
            removeDuplicates(nodeIDs);
            
            // Get node models
            var models = nodeIDs.map(function(d){
                return Hub.get("node").get(d);
            });
            
            return models;
        }
    });
    
    
    pvt.setUpNavbar = function(){
    	var thisView = this;
    	
    	var $navbar = thisView.$el.find(pvt.consts.DOM_NAVBAR);
    	if($navbar.length === 0){
            $navbar = thisView.$el.find(pvt.consts.DOM_NAVBAR_MOBILE);
            if($navbar.length === 0){
                console.warn("no navbar element detected. Ignoring navbar.");
                return;
            }
    	}
    	
    	var navBar = new NavBarView({ id: "nav-bar-view", el: $navbar[0] });
        navBar.render();
            
    };
    
    return SiteView;
});