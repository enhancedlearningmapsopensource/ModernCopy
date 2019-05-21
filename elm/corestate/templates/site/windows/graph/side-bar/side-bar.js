/* global appstate */
define([
    "jquery",
    "text!./side-bar.html",
    "backbone",
    "core",
    "mustache",
    "hub-lib"
],
function (
    $,
    Template,
    Backbone,
    Core,
    Mustache,
    Hub
) {

    var pvt = {};
    pvt.consts = {};
    pvt.consts.DOM_MUSTACHE_MULTI = "#side-bar-multi-tab";
    pvt.consts.DOM_MUSTACHE_SINGLE = "#side-bar-single-tab";
    pvt.consts.BUTTON_WIDTH = 25; /// 25%
    pvt.consts.ICONS = {};
    pvt.consts.ICONS.mapviewinfo = "icon-mapinfo";
    pvt.consts.ICONS.resources = "glyphicon glyphicon-file";
    pvt.consts.ICONS.nodetable = "glyphicon glyphicon-th-list";
    pvt.consts.ICONS.standards = "icon-standards";
    pvt.consts.ICONS.mymapviews = "icon-mymapviews";
    pvt.consts.ICONS.mapdiscussion = "icon-discussion";
    pvt.consts.MAP_INFO_TAB_NAME = "Map View Info";

    var SideBarView = Core.View.extend({
        template: Template,
        events: {
            "click .menu-icon" : "delegateOpenSidePanel",
        },

        /**
    	 * Adds a menu item to the side bar. Order is important
 		 * @param {Object} item - the menu item to add
    	 */
        addMenuItem: function (index, item) {
            var thisView = this;
            var menuItems = thisView.model.get("menuItems");
            menuItems.push({ name: item, index: index });
        },

        /*delegateHideBar: function (e) {
            var thisView = this;
            thisView.model.set("sideBarOpen", false);
        },*/

        delegateOpenSidePanel: function(){
            if(appstate.get("sidepanelopen") === true){
                appstate.set("sidepanelopen", false);
            }
            appstate.set({
                "sidepanelopen": true,
                "activeWindow": "graph"
            });
            /*if(!appstate.has("sidePanelPrev")){
                appstate.set({
                    sidePanel: pvt.consts.MAP_INFO_TAB_NAME,
                    activeWindow: "graph"
                });
            }else{
                appstate.set({
                    sidePanel: appstate.get("sidePanelPrev"),
                    activeWindow: "graph"
                });
            }*/
        },

        delegateSetSidePanelPrev: function(model){
            //if(model && model.get("sidePanel") === null){
                model.set("sidePanelPrev", model._previousAttributes.sidePanel);   
            //}
        },

        delegateSideBarVisible: function () {
            var thisView = this;
            var sideBarVisible = thisView.model.get("sideBarOpen");
            var $sideBar = thisView.$el;
            var $sideBarContent = $sideBar.find("#side-bar-content");
            var $sideBarShow = $sideBar.find("#side-bar-show");

            /// Swap widths to pixels from percent
            $sideBarShow.width($sideBarShow.width());
            $sideBarContent.width($sideBarContent.width());

            var swapTime = 1000;
            if (sideBarVisible) {
                /// Set up initial positions
                $sideBarContent.removeClass("closed");
                $sideBarContent.css("position", "fixed");
                $sideBarContent.css("left", "-10%");
                $sideBarContent.css("height", "90%");
                $sideBarShow.css("position", "fixed");
                $sideBarShow.css("left", "0%");
                $sideBarShow.css("height", "90%");

                /// Tabs 
                $sideBarContent.animate({
                    left: "0%"
                }, {
                    duration: swapTime,
                    always: function () {
                        $sideBarContent.css("left", "initial");
                        $sideBarContent.css("position", "relative");
                        $sideBarContent.css("height", "100%");

                        /// Swap back to percent
                        $sideBarContent.css("width", "100%");
                    },
                    queue: false
                });

                /// Button
                $sideBarShow.animate({
                    left: "-1.25%"
                }, {
                    duration: swapTime * 0.25,
                    always: function () {
                        $sideBarShow.css("left", "initial");
                        $sideBarShow.css("position", "relative");
                        $sideBarShow.addClass("closed");
                        $sideBarShow.css("height", "100%");

                        /// Swap back to percent
                        $sideBarShow.css("width", pvt.consts.BUTTON_WIDTH + "%");
                    },
                    queue: false
                });
            } else {
                /// Set up initial positions
                $sideBarShow.removeClass("closed");

                $sideBarContent.css("position", "fixed");
                $sideBarContent.css("left", "0%");
                $sideBarContent.css("height", "90%");
                $sideBarShow.css("position", "fixed");
                $sideBarShow.css("left", "-1.25%");
                $sideBarShow.css("height", "90%");

                /// Tabs 
                $sideBarContent.animate({
                    left: "-10%"
                }, {
                    duraction: swapTime,
                    always: function () {
                        $sideBarContent.css("left", "initial");
                        $sideBarContent.css("position", "relative");
                        $sideBarContent.css("height", "100%");
                        $sideBarContent.addClass("closed");

                        /// Swap back to percent
                        $sideBarContent.css("width", "100%");
                    },
                    queue: false
                });

                /// Button
                $sideBarShow.animate({
                    left: "0%"
                }, {
                    duraction: swapTime * 0.25,
                    always: function () {
                        $sideBarShow.css("left", "initial");
                        $sideBarShow.css("position", "relative");
                        $sideBarShow.css("height", "100%");

                        /// Swap back to percent
                        $sideBarShow.css("width", pvt.consts.BUTTON_WIDTH + "%");
                    },
                    queue: false
                });
            }
        },

        initialize: function () {
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            
            thisView.$el = $(thisView.el);
            thisView.model = new Backbone.Model({id: "side-bar-model"});
            
            thisView.listenTo(appstate, "change:sideBarOpen", thisView.delegateSideBarVisible);
            thisView.listenTo(appstate, "change:sidePanel", thisView.delegateSetSidePanelPrev);
            thisView.listenTo(Hub.get("user"), "change", thisView.render);
        },

        render: function () {
            var thisView = this;
            var renderOb = {};
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }
    });

    /**
	 * Triggered when a user starts panning the graph
	 * @param {object} evt - the event
	 */
    pvt.delegateStartDrag = function (evt) {
        var thisView = this;
        console.assert(evt.eventType === "elm-start-drag");

        thisView.$el.addClass("numb");
        thisView.$el.find("#side-bar-content").addClass("numb");
    };

    /**
	 * Triggered when a user stops panning the graph
	 * @param {object} evt - the event
	 */
    pvt.delegateStopDrag = function (evt) {
        var thisView = this;
        console.assert(evt.eventType === "elm-stop-drag");

        thisView.$el.removeClass("numb");
        thisView.$el.find("#side-bar-content").removeClass("numb");
    };
    return SideBarView;
});