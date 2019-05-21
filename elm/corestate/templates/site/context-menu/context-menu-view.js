//console.log("...ContextMenuView loading");
define(["backbone",
    "text!./template.html",
    "corestate/templates/site/context-menu/context-menu-model",
    "corestate/templates/site/context-menu/loader/context-menu-loader",
    "corestate/templates/site/context-menu/context-menu-factory",
    "mustache"],
        function (Backbone,
                Template,
                ContextMenuModel,
                ContextMenuLoader,
                ContextMenuFactory,
                Mustache) {

            var pvt = {};
            pvt.consts = {};
            pvt.consts.TEMPLATE_PATH = gRoot + "corestate/js/context-menu/templates/template.html";

            pvt.consts.CLICK_OBJECT = {};
            pvt.consts.CLICK_OBJECT.CIRCLE = "CIRCLE";
            pvt.consts.CLICK_OBJECT.EDGE = "EDGE";

            pvt.consts.TRIGGER = {};
            pvt.consts.TRIGGER.CLICK = "CLICK";
            pvt.consts.TRIGGER.HOVER = "HOVER";
            pvt.consts.TRIGGER.HOVER = "UNHOVER";
            pvt.consts.DOM_MUSTACHE = "#context-menu-template";

            var ContextMenuView = Backbone.View.extend({
                template: Template,
                events: {
                    "context-event": "delegateContextEvent",
                    "click .cmo-c-icon": "delegateCircleClicked",
                    "click .context-menu-option": "delegateOptionSelected",
                    "click": "delegateCloseContext"

                },

                delegateCircleClicked: function (e) {
                    var thisView = this;

                    /// Handle the current action
                    var $el = $(e.currentTarget);
                    var menuName = $el.parents(".context-menu-option").find(".option-name").html().trim();
                    var context = thisView.model.get("context");
                    var trigger = thisView.model.get("trigger");

                    var color = null;
                    if ($el.hasClass("c-red")) {
                        color = "red";
                    } else if ($el.hasClass("c-blue")) {
                        color = "blue";
                    } else if ($el.hasClass("c-gray")) {
                        color = "gray";
                    } else if ($el.hasClass("c-green")) {
                        color = "green";
                    } else if ($el.hasClass("c-orange")) {
                        color = "orange";
                    }
                    
                    assertDefined(color);

                    var reactions = thisView.model.get("reactions");
                    for (var r = 0; r < reactions.length; r++) {
                        var react = reactions[r];
                        if (react.name === menuName) {
                            if (react.hasOwnProperty("reverse")) {
                                var reverse = react.reverse;
                                if (reverse !== null) {
                                    thisView.model.set("reverse", react.reverse);
                                }
                            }
                            react.options.circleCallback(color);
                            break;
                        }
                    }

                    thisView.delegateCloseContext(e);
                    return false;
                },

                delegateCloseContext: function (e) {
                    var thisView = this;
                    thisView.model.set("visible", false);
                    thisView.model.set("creator", null);
                    thisView.render();
                },

                delegateContextEvent: function (e, options) {
                    var thisView = this;
                    var useContextMenu = thisView.model.get("useContextMenu");

                    if (useContextMenu) {
                        if (options.reactions.length > 0) {
                            if (!options.hasOwnProperty("creator") || !options.creator) {
                                throw Error("creator required");
                            }

                            // If the creator was clicked again then hide the context menu
                            if (thisView.model.get("creator") == options.creator) {
                                thisView.delegateCloseContext();
                            } else {
                                thisView.model.set("creator", options.creator);
                                thisView.model.set("visible", true);
                                thisView.model.set("x", options.e.pageX);
                                thisView.model.set("y", options.e.pageY);
                                thisView.model.set("context", options.objectType);
                                thisView.model.set("trigger", options.trigger);
                                thisView.model.set("reactions", options.reactions);
                                thisView.render();
                            }
                        }
                    } else {
                        options.default(e);
                    }

                    return false;
                },

                delegateOptionSelected: function (e) {
                    var thisView = this;
                    if (!thisView.model.get("visible")) {
                        return;
                    }

                    /// Reverse the previous action
                    var reverse = thisView.model.get("reverse");
                    if (reverse != null) {
                        reverse();
                    }
                    thisView.model.set("reverse", null);

                    /// Handle the current action
                    var $el = $(e.currentTarget);

                    // Split on < to ignore any additional elements within the context option
                    //var menuName = $el.html().split("<")[0].trim();
                    var menuName = $el.find(".option-name").html();
                    var context = thisView.model.get("context");
                    var trigger = thisView.model.get("trigger");

                    var reactions = thisView.model.get("reactions");
                    for (var r = 0; r < reactions.length; r++) {
                        var react = reactions[r];
                        if (react.name == menuName) {
                            if (react.hasOwnProperty("reverse")) {
                                var reverse = react.reverse;
                                if (reverse != null) {
                                    thisView.model.set("reverse", react.reverse);
                                }
                            }
                            react.callback();

                            break;
                        }
                    }

                    thisView.delegateCloseContext(e);
                    return false;
                },

                /**
                 * Use this function to create and initialize a context menu factory 
                 * which is later passed when a context menu is required.
                 *
                 * example: 
                 *      var menu = menuView.create('random','click');
                 *      menu.addItem('Menu Option 1', function(){alert('Option 1 clicked');});
                 *      menu.show();
                 *
                 * @param {string} menuName - the name of the context menu
                 * @param {string} menuTrigger - the trigger of the menu (e.g. 'click','scroll','mouseover')
                 * @return {object} - context menu factory.
                 */
                create: function (menuName, menuTrigger, creator) {
                    if (!creator) {
                        throw Error("please provide a creator");
                    }
                    return new ContextMenuFactory(menuName, menuTrigger, this, creator);
                },

                /**
                 * Get a context menu factory stored earlier using the store() function
                 *
                 * @param {string} menuName - the name of the stored menu factory
                 * @return {object} - the factory if one exists, otherwise null
                 */
                get: function (factoryName) {
                    var thisView = this;

                    // Validate
                    if (typeof factoryName === 'undefined' || factoryName === null) {
                        return null;
                    }

                    // Get storage
                    var storage = thisView.model.get("storage");

                    // Check existance
                    return (storage.hasKey(factoryName)) ? storage.fetch(factoryName) : null;
                },
                
                hide: function(){
                    this.delegateCloseContext(null);
                },

                initialize: function () {
                    var thisView = this;
                    thisView.$el = $(thisView.el);

                    thisView.model = new ContextMenuModel({id: "context-menu-model"});


                    /// Add context menu items
                    //ContextMenuLoader.load(thisView);

                    // Load the mustache template
                    //var template = thisView.$el.find(pvt.consts.DOM_MUSTACHE).html();
                    Mustache.parse(thisView.template);

                    // Store the template
                    //thisView.model.set("template", template);
                    application.contextmenu = thisView;

                    /// Listeners 
                    //thisView.model.set("application", null);
                    //thisView.listenTo(thisView.model, "change:application", thisView.applicationAccessGranted);
                    
                    thisView.listenTo(appstate, "change:activeGraph", thisView.delegateCloseContext);
                    thisView.listenTo(appstate, "change:activeWindow", thisView.delegateCloseContext);
                    thisView.listenTo(appstate, "change:standardClicked", thisView.delegateCloseContext);
                    thisView.listenTo(appstate, "change:sidePanel", thisView.delegateCloseContext);
                    thisView.listenTo(appstate, "change:resourceManagerOpen", thisView.delegateCloseContext);
                    thisView.listenTo(appstate, "change:omniSearchOpen", thisView.delegateCloseContext);

                    thisView.render();
                },

                render: function () {
                    var thisView = this;
                    var renderOb = {};

                    var template = thisView.template;
                    var visible = thisView.model.get("visible");
                    if (template !== null && visible) {
                        var x = thisView.model.get("x");
                        var y = thisView.model.get("y");
                        var context = thisView.model.get("context");
                        var trigger = thisView.model.get("trigger");
                        var reactions = thisView.model.get("reactions");
                        var treatHoverAsClick = thisView.model.get("treatHoverAsClick");
                        
                        reactions.sort(function(a,b){
                            return a.name.localeCompare(b.name);
                        });
                        
                        renderOb = {objectType: context.toUpperCase(), items: reactions, allowHover: !treatHoverAsClick};

                        if (reactions.length > 0) {
                            var $content = thisView.$el;
                            
                            var $el = $(Mustache.render(thisView.template, renderOb));
                            thisView.$el.after($el);
                            thisView.$el.remove();
                            thisView.setElement($el[0]);
                            
                            //thisView.$el.html($(Mustache.render(template, renderOb)));

                            $content.css("top", y);
                            $content.css("left", x);
                            thisView.$el.addClass("open");
                            thisView.reposition();
                        } else {
                            thisView.delegateCloseContext();
                        }
                    } else {
                        thisView.$el.removeClass("open");
                    }
                },

                /**
                 * Reposition the context menu so that it is not partially off the page.
                 */
                reposition: function () {
                    var thisView = this;
                    var x = thisView.model.get("x");
                    var y = thisView.model.get("y");

                    var $window = $(window);
                    //var screenTop 	= $window.offset().top;
                    //var screenLeft	= $window.offset().left;
                    var screenWidth = $window.width();
                    var screenHeight = $window.height();

                    var $menu = thisView.$el.find(".container-fluid");
                    var menuWidth = $menu.width();
                    var menuHeight = $menu.height();

                    function verify(top, bottom, left, right) {
                        if (top < 0) {
                            return false;
                        } else if (bottom > (0 + screenHeight)) {
                            return false;
                        } else if (left < 0) {
                            return false;
                        } else if (right > (0 + screenWidth)) {
                            return false;
                        } else {
                            $menu.css("top", top);
                            $menu.css("left", left);
                            return true;
                        }
                    }

                    // Try place lower right
                    var top = y;
                    var bottom = y + menuHeight;
                    var left = x;
                    var right = x + menuWidth;

                    if (verify(top, bottom, left, right)) {
                        return;
                    }

                    // Try place upper right
                    top = y - menuHeight;
                    bottom = y;
                    left = x;
                    right = x + menuWidth;

                    if (verify(top, bottom, left, right)) {
                        return;
                    }

                    // Try place upper left
                    top = y - menuHeight;
                    bottom = y;
                    left = x - menuWidth;
                    right = x;

                    if (verify(top, bottom, left, right)) {
                        return;
                    }

                    // Try place lower left
                    top = y;
                    bottom = y + menuHeight;
                    left = x - menuWidth;
                    right = x;
                    if (verify(top, bottom, left, right)) {
                        return;
                    }
                },

                /**
                 * Show the context menu.
                 *
                 * @param {event} e - the javascript event that triggered the context menu.
                 * @param {object} factory - the factory to show
                 */
                show: function (e, factory) {

                    var thisView = this;

                    factory.create().then(function (options) {
                        options.e = e;
                        thisView.delegateContextEvent(e, options);
                    });


                    //throw Error();

                },

                /**
                 * Store a factory for later use. This is to account for the lack of 
                 * personal storage avaliable to most views. 
                 *
                 * @param {string} factoryName - the name of the stored menu factory
                 * @param {object} factory - the menu factory to store
                 * @return {object} - the factory if one exists, otherwise null
                 */
                store: function (factoryName, factory) {
                    var thisView = this;

                    // Validate
                    if (typeof factoryName === 'undefined' || factoryName === null) {
                        return;
                    }
                    if (typeof factory === 'undefined' || factory === null) {
                        return;
                    }

                    // Get storage
                    var storage = thisView.model.get("storage");

                    // Check existance
                    if (storage.hasKey(factoryName)) {
                        console.warn("There is already a factory stored using this name: " + factoryName + ". Overwriting with new object.");
                    }

                    // Store
                    storage.store(factoryName, factory);
                }

            });
            return ContextMenuView;
        });