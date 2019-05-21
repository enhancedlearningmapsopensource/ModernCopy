/* global appstate, hasPermission */

const files = [
    "jquery",
    "core",
    "text!./side-panel.html",
    "mustache",
    "side-panel/panels/map-view-info/map-view-info-view",
    "side-panel/panels/resources/resources-view",
    "side-panel/panels/node-table/node-table-view",
    "side-panel/panels/standards/standards-view",
    "side-panel/panels/map-discussion/lib/map-discussion-view",
    "map-manager-lib",
    "side-panel/panels/roster/roster-view",
    "hub-lib",
    "constants"
];

if(loadCascade === true){
    files.push("side-panel/panels/cascade-panel/cascade-view");
}

define(files,
function (
    $,
    Core,
    Template,
    Mustache,
    MapViewInfoView,
    ResourcesView,
    NodeTableView,
    StandardsView,
    DiscussionView,
    MapView,
    RosterView,
    Hub,
    Constants,
    CascadeView
) {

    var pvt = {
        consts: {
            DOM_TITLE: "#title > div:first > h3",
            DOM_TAB: ".side-panel-tab",
        }
    };

    pvt.consts.MENU_MAP = {
        MAP_VIEW_INFO: {
            NAME: "Map View Info",
            MODULE: MapViewInfoView,
            PREF: "MENU_MVI"
        },
        RESOURCES: {
            NAME: "Resources",
            MODULE: ResourcesView,
            PREF: "MENU_R"
        },
        NODE_TABLE: {
            NAME: "Node Table",
            MODULE: NodeTableView,
            PREF: "MENU_NT"
        },
        STANDARDS: {
            NAME: "Standards",
            MODULE: StandardsView,
            PREF: "MENU_S"
        },
        MAP_VIEWS: {
            NAME: "My Map Views",
            MODULE: MapView,
            PREF: "MENU_MMV"
        },
        DISCUSSIONS: {
            NAME: "Discussion",
            MODULE: DiscussionView,
            PREF: "MENU_D"
        },
        ROSTER: {
            NAME: Constants.STRINGS.ROSTER,
            MODULE: RosterView,
            PREF: "MENU_SLT"
        },
        CASCADE: {
            NAME: Constants.STRINGS.CASCADE,
            MODULE: CascadeView,
            PREF: "MENU_C"
        }
    };

    var SidePanelView = Core.View.extend({
        template: Template,
        tabs: [],

        events: {
            "click .side-panel-tab": "delegateTabClicked",
            "click #btn-close-side-panel" : "delegateCloseSidePanel",
        },

        /**
         * Triggered when a user clicks on the "close tab" button
         */
        delegateCloseSidePanel: function () {
            appstate.set("sidepanelopen", false);
        },

        /**
         * Triggered when a user clicks on a tab in the side panel
         */
        delegateTabClicked: function(e){
            var $el = $(e.currentTarget);
            var name = $el.find("a").html().trim();
            e.stopPropagation();
            appstate.set({
                sidePanel: name,
                omniSearchOpen: false
            });
        },

        initialize: function () {
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);

            // Get permissions
            var permissionCodes = ["RESOURCE", "DISCUSSIONS"];
            if(config.hasOwnProperty("LOCATER_TOOL_PATH") && config.LOCATER_TOOL_PATH !== null && config.LOCATER_TOOL_PATH.trim().length > 0){
                permissionCodes.push("ROSTER");
            }
            Promise.all(permissionCodes.map(function(code){
                return hasPermission(code);
            })).then(function(permissions){
                var codeMap = {};
                for(var i = 0; i < permissions.length; i++){
                    codeMap[permissionCodes[i]] = permissions[i];
                } 
                return Promise.resolve(pvt.initializePanel.call(thisView, codeMap));
            });
            
            thisView.listenTo(appstate, "change:sidePanel", thisView.render);
            thisView.listenTo(appstate, "change:sidepanelopen", thisView.render);
            thisView.listenTo(appstate, "change:activeGraph", thisView.render);
            thisView.listenTo(appstate, "change:activeWindow", thisView.render);
            thisView.listenTo(Hub.get("user"), "change", thisView.render);
        },
        
        

        /**
         * Render the side panel
         * @return {Promise}
         */
        render: function(){
            var thisView = this;
            if(thisView.tabs.length === 0){
                return;
            }

            var renderOb = {
                tabs: thisView.tabs
            };
            
            // Detach panels (always present)
            var always = ["mapinfo", "nodetable", "standards"];
            always.forEach(function(tab){
                thisView.get(tab).$el.detach();
            });

            // Detach possible panels (may be missing)
            var possible = [ "discussion", "maps", "resource", "roster", "cascade"];
            possible.forEach(function(tab){
                if(thisView.has(tab) === true){
                    thisView.get(tab).$el.detach();
                }
            });
            
            
            var $scroll = thisView.$el.find(".side-panel-content.open > div");
            if($scroll.length > 0){
                var scrollTop = $scroll.scrollTop();
            }
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            var sidePanel = appstate.get("sidePanel");
            const panelOpen = appstate.get("sidepanelopen");
            if(sidePanel === null){
                appstate.set("sidePanel", "Map View Info");
                return;
            }
            if(panelOpen === false){
                return;
            }
            
            // Reattach
            var $content = thisView.$el.find("#content");
            switch(sidePanel){
            case "Discussion":
                if(thisView.has("discussion") === true){
                    $content.html(thisView.get("discussion").$el);
                }
                break;
            case "Map View Info":
                $content.html(thisView.get("mapinfo").$el);
                break;
            case "My Map Views":
                if(thisView.has("maps") === true){
                    $content.html(thisView.get("maps").$el);
                }
                break;
            case "Node Table":
                $content.html(thisView.get("nodetable").$el);
                break;
            case "Resources":
                if(thisView.has("resource") === true){
                    $content.html(thisView.get("resource").$el);
                }
                break;
            case "Standards":
                $content.html(thisView.get("standards").$el);
                break;
            case Constants.STRINGS.ROSTER:
                if(thisView.has("roster") === true && config.hasOwnProperty("LOCATER_TOOL_PATH") && config.LOCATER_TOOL_PATH !== null && config.LOCATER_TOOL_PATH.trim().length > 0){
                    $content.html(thisView.get("roster").$el);
                }
                break;
            case Constants.STRINGS.CASCADE:
                if(thisView.has("cascade") === true){
                    $content.html(thisView.get("cascade").$el);
                }
                break;
            default:
                throw Error("Unknown side panel: " + sidePanel);
            }
            //
            
            if($scroll.length > 0){
                $scroll.scrollTop(scrollTop);
            }
            
            // Set the side panel main title
            var $title = thisView.$el.find(pvt.consts.DOM_TITLE);
            $title.html(sidePanel);
            
            // Set the correct tab highlighting
            pvt.setTabHighlighting.call(thisView);
            
            thisView.$el.find("[data-toggle=\"tooltip\"]").each(function(){
                $(this).tooltip();
            });
        }
    });
    
    /**
     * Get the menu object that matches the given name
     * @param {string} name
     * @return {Object} - the menu
     */
    pvt.getMenuWithName = function(name){
        var menu = Object.keys(pvt.consts.MENU_MAP).find(function(d){
            return (pvt.consts.MENU_MAP[d].NAME.localeCompare(name) === 0);
        });
        return pvt.consts.MENU_MAP[menu];
    };
    
    /**
     * Get the next menu that is open after the given menu
     * @param {string} after - the menu to look after
     * @return {Object} - the menu
     * 
     * Example:
     * 
     * If the menus: [menua, menub, menuc] exist and this function is called with 
     * after=menua then the function will return menub if it is visible, otherwise
     * menub.
     * 
     * If called with after=menuc, it will return menua (if it is visible)
     */
    pvt.getNextVisibleMenu = function(after){
        // Find the menu
        var menuFound = false;
        var nextMenu = null;
        Object.keys(pvt.consts.MENU_MAP).find(function(nm){
            var menu = pvt.consts.MENU_MAP[nm];
            if(!menuFound){
                if(menu.NAME.localeCompare(after.NAME) === 0){
                    // Menu found. Now scan 
                    menuFound = true;
                }
            }else{
                // Check visible
                var isVisible = pvt.isMenuVisible(menu);
                if(isVisible){
                    nextMenu = menu;
                    return true;
                }
            }
            return false;
        });
        
        if(!menuFound){
            throw Error("could not find menu");
        }
        
        if(nextMenu !== null){
            return nextMenu;
        }
        
        // Scan from the beginning 
        Object.keys(pvt.consts.MENU_MAP).find(function(nm){
            var menu = pvt.consts.MENU_MAP[nm];
            if(menu.NAME.localeCompare(after.NAME) === 0){
                throw Error("No other menus are visible");
            }else{
                // Check visible
                var isVisible = pvt.isMenuVisible(menu);
                if(isVisible){
                    nextMenu = menu;
                    return true;
                }
            }
            return false;
        });
        
        return nextMenu;
    };

    pvt.initializePanel = function(permissions){
        var thisView = this;
        thisView.tabs.push("Map View Info");

        // Create Resources panel view
        if(permissions.RESOURCE === true){
            thisView.tabs.push("Resources");
            thisView.add("resource", new ResourcesView({
                id: "resources-view"
            })).render();
        }

        thisView.tabs.push("Node Table");
        thisView.tabs.push("Standards");
        thisView.tabs.push("My Map Views");

        // Create Discussions panel view
        if(permissions.DISCUSSIONS === true){
            thisView.tabs.push("Discussion");
            thisView.add("discussion", new DiscussionView({
                id: "discussion-view"
            })).render();
        }

        // Create Roster panel view
        if(permissions.ROSTER === true && config.hasOwnProperty("LOCATER_TOOL_PATH") && config.LOCATER_TOOL_PATH !== null && config.LOCATER_TOOL_PATH.trim().length > 0){
            thisView.tabs.push(Constants.STRINGS.ROSTER);
            thisView.add("roster", new RosterView({
                id: "roster-view"
            })).render();
        }

        if(window.isPackageLoaded("cascade-lib") && permissions.RESOURCE === true){
            console.warn("todo: assign cascade a separate permission.");
            thisView.tabs.push(Constants.STRINGS.CASCADE);
            thisView.add("cascade", new CascadeView({
                id: "cascade-view"
            })).render();
        }
        
        thisView.add("mapinfo", new MapViewInfoView({
            id: "mapinfo-view"
        })).render();            
        thisView.add("standards", new StandardsView({
            id: "standards-view"
        })).render();
        thisView.add("maps", new MapView({
            id: "map-view"
        })).render();
        thisView.add("nodetable", new NodeTableView({
            id: "node-table-view"
        })).render();

        thisView.render();
    };
    
    /**
     * Test to see whether the menu is visible
     * @param {Object} menu - the menu
     * @return {boolean}
     */
    pvt.isMenuVisible = function(menu){
        var pref = window.getPreference(menu.PREF);
        return (pref === null || pref.localeCompare("t") === 0);
    };
    
    /**
     * Set the tab highlighting based on the application's side panel attribute
     */
    pvt.setTabHighlighting = function(){
        var thisView = this;
        var sidePanel = appstate.get("sidePanel");
        
        thisView.$el.find(pvt.consts.DOM_TAB).each(function () {
            var thisTab = $(this);
            var tabName = thisTab.find("a").html().trim();

            // Get menu matching name
            var menu = pvt.getMenuWithName(tabName);
            if(typeof menu === "undefined"){
                throw Error("Cannot find menu with name: " + tabName);
            }

            // Determine whether the tab should be hidden
            var showTab = pvt.isMenuVisible(menu);

            // Determine whether the current tab is open
            var tabOpen = (tabName.localeCompare(sidePanel.trim()) === 0);



            // Tab should be show
            if(showTab){
                // Show tab
                thisTab.show();

                // Tab is open
                if (tabOpen) {
                    thisTab.addClass("panel-open");
                } 

                // Tab is not open
                else {
                    thisTab.removeClass("panel-open");
                }
            }

            // Tab should not be shown
            else if(!showTab){
                thisTab.hide();

                // Tab is open
                if(tabOpen){
                    // Get the next tab that is visible
                    var nextTab = pvt.getNextVisibleMenu(menu);

                    // Open the tab
                    thisView.model.set({
                        sidePanelPrev: null,
                        sidePanel: nextTab.NAME
                    });
                }
            }
        });
    };

    return SidePanelView;
});