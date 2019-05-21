/* global testSvgModule, application */

/**
 * Empty Model implementation. Currently doesn't serve much purpose
 * but might later, so acts as a placeholder.
 */
define([
    "backbone",
    "text!./graph-window.html",
    "mustache",
    "corestate/templates/site/windows/graph/bottom-panel/bottom-panel",
    "corestate/templates/site/windows/graph/side-bar/side-bar",
    "../minimized/panel/panel",
    "corestate/templates/site/windows/graph/graph-area/graph-area",
    "activeGraph",
    "corestate/js/svg-interface/svg-interface",
    "corestate/templates/site/windows/graph/main/graph-click-handler",
    "side-panel/main/side-panel",
    "map-legend/map-legend",
    "hub-lib"
], function (
    Backbone,
    Template,
    Mustache,
    BottomPanelView,
    SideBarView,
    MinimizedPanelView,
    GraphAreaView,
    ActiveGraph,
    SvgRender,
    GraphClickHandler,
    SidePanelView,
    MapLegend,
    Hub
) {

    var pvt = {
        consts: {
            DOM_PANEL_BOTTOM: "#bottom-panel",
            DOM_PANEL_SIDE: "#side-panel",
            DOM_PANEL_MINIMIZED: "#minimized-panel",
            DOM_GRAPH_AREA: "#graph-wrapper",
            DOM_SIDE_BAR: "#side-bar"
        }
    };

    var GraphWindowView = Backbone.View.extend({
        template: Template,
        /**
         * If side panel is not null then load it
         * @return Promise;
         */
        // checkPreloadedSidePanel: function(){
        //     var thisView = this;
        //     return (thisView.model.get("sidePanel") !== null) ? thisView.sidePanelChanged(thisView.model, {}) : Promise.resolve();
        // },

        delegateChangedActiveGraph: function (model, options) {
            var thisView = this;
            var activeGraphIndex = thisView.model.get("activeGraphIndex");
            var activeGraph = thisView.model.get("views").graphs[activeGraphIndex];
            activeGraph.setGraphDefinition(thisView.model.get("activeGraph"));
        },

        delegateChangedActiveGraphIndex: function (model, options) {
            var thisView = this;
            var activeGraphIndex = thisView.model.get("graphs").get("activeGraphIndex");
            var activeGraph = thisView.model.get("graphs").get(activeGraphIndex);
            thisView.model.get("graphs").set("activeGraph", activeGraph);
        },

        delegateGraphClicked: function () {
            var thisView = this;
            var graph = appstate.get("graphClicked");
            if(graph === null){
                return;
            }
            
            appstate.set({
                "graphClicked": null,
                "omniSearchOpen": false
            });
            thisView.model.get("clickHandler").handleClick(graph.id,graph.graph);
        },

        delegateGraphHovered: function(e){
            var thisView = this;
            thisView.model.set("activeGraphFocusedCircle", null);
        },

        delegatePan: function(e){
            var thisView = this;
            alert("pan");
        },

        getGraphAreaEl: function () {
            var thisView = this;

            return null;
        },

        /**
         * Initialize the graph window
         * @return {Promise}
         */
        initialize: function () {
            var thisView = this;
            Backbone.View.prototype.initialize.apply(thisView);
            Mustache.parse(thisView.template);

            thisView.model = new Backbone.Model({id: "graph-window-model", "clickHandler": new GraphClickHandler()});
            
            // Construct the fixed views
            thisView.temp_children = {};
            thisView.temp_children.grapharea = (new GraphAreaView({ id: "graph-area-view" }));
            thisView.temp_children.sidebar = (new SideBarView({ id: "side-bar-view" }));
            thisView.temp_children.sidepanel = (new SidePanelView({ id: "side-panel-view" }));
            thisView.temp_children.minpanel = (new MinimizedPanelView({ id: "minimized-panel-view"}));
            
            // Construct the bottom panel
            thisView.temp_children.botpanel = new BottomPanelView({ 
                id: "bottom-panel-view"
            });
            
            // Construct map legend
            thisView.temp_children.legend = new MapLegend({
                id: "map-legend"
            });
            
            // Render children
            Object.keys(thisView.temp_children).forEach(function(d){
                thisView.temp_children[d].render();
            });

            // Listeners
            thisView.listenTo(appstate, "change:cascadeopen", thisView.render);
            thisView.listenTo(appstate, "change:activeSubject", thisView.render);
            thisView.listenTo(appstate, "change:activeSet", pvt.activeSetChanged);
            thisView.listenTo(appstate, "change:activeWindow", thisView.render);
            thisView.listenTo(appstate, "change:sidePanel", thisView.render);
            thisView.listenTo(appstate, "change:sidepanelopen", thisView.render);
            thisView.listenTo(appstate, "change:graphClicked", thisView.delegateGraphClicked);
            thisView.listenTo(appstate.get("selectectedcircles"), "update", thisView.render);
            thisView.listenTo(Hub.get("userpreference"), "update", thisView.render);
            thisView.listenTo(Hub.get("userpreference"), "change", thisView.render);
            
            thisView.listenTo(appstate, "change:draggingGraph", function(model, options){
                var draggingGraph = appstate.get("draggingGraph");
                if(draggingGraph){
                    //thisView.off("click #graph-wrapper", "delegateGraphClicked");
                    thisView.undelegateEvents();
                }else{
                    setTimeout(function(){
                        thisView.delegateEvents();
                        //thisView.on("click #graph-wrapper", "delegateGraphClicked");
                    }, 20);
                }                
            });            
        },
        
        
        
        /**
         * Initialize the side panel
         * @return {Promise (completion)}
         */
        // initializeSidePanel: function(){
        //     var thisView = this;
        //     return new Promise(function(resolve, reject){
        //         require(["side-panel/main/side-panel"], function(SidePanelView){
        //             thisView.model.get("views").sidePanel = new SidePanelView({ 
        //                 id: 'side-panel-view', 
        //                 model: thisView.model, 
        //                 el: thisView.$el.find(pvt.consts.DOM_PANEL_SIDE)[0] 
        //             });
        //             resolve(thisView.model.get("views").sidePanel);
        //         });
        //     });
        // },

        load: function(){
            var thisView = this;
            return thisView.model.get("views").graphArea.load().then(function(){
                //return thisView.model.get("views").printGraph.load();
            });
        },
        
        /**
         * Loads the print graph. Needs to happen AFTER the svg library is set up.
         * @return {undefined}
         */
        loadPrintGraph: function(){
            var thisView = this;
            pvt.loadPrintGraph.call(thisView);
        },

        isReady: function () {
            return true;
        },

        print: function(){
            var thisView = this;

            // Make print graph visible
            //$("#print-div").removeClass("visible-print-block");

            // Recover the graph transform
            var subgraph = ActiveGraph.getServerModel(thisView.model);
            var graphManager = application.graphstate;
            if(subgraph === null){
                $("#print-header").html("<h3>"+graphManager.get().graphID+"</h3>");
            }else{
                $("#print-header").html("<h3>"+subgraph.get("title")+"</h3>");
            }
            return SvgRender(graphManager.handle(), thisView.model, "print", {}, true).then(function(){
                const viewBox = $("#print-div>svg").attr("viewBox").split(" ");
                const w = Number(viewBox[2]);
                const h = Number(viewBox[3]);
                
                if(h > w){
                    viewBox[2] = h
                    $("#print-div>svg").attr("viewBox", viewBox.join(" "))
                }

                $("#print-replace").hide();
                $("#print-replace").removeClass("visible-print-block");
                $("#print-div").addClass("visible-print-block");
                $("#print-div").show();
                window.print();
            });
        },

        /**
         * Render the graph window
         * @return {Promise (completion)}
         */
        render: function () {
            var thisView = this;
            var renderOb = {
                open: {
                    cascade: (window.appstate.get("cascadeopen")),
                    sidepanel: (window.appstate.get("sidepanelopen")),
                    botpanel: (window.appstate.get("selectedcircles").length > 0)
                }
            };
            
            
            
            // Detach
            thisView.temp_children.grapharea.$el.detach();
            thisView.temp_children.sidebar.$el.detach();
            thisView.temp_children.sidepanel.$el.detach();
            thisView.temp_children.minpanel.$el.detach();
            thisView.temp_children.botpanel.$el.detach();
            thisView.temp_children.legend.$el.detach();

            if(isPackageLoaded("cascade-lib")){
                application.cascadeplugin.screen.$el.detach();
            }

            //appstate.set("graphwindowrender", null);
            //appstate.set("graphwindowrender", timeNow());
            
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            
            // Reattach
            
            if(isPackageLoaded("cascade-lib") && window.appstate.get("cascadeopen") === true){
                thisView.$el.find(".cascade-window").append(application.cascadeplugin.screen.$el);
            }else{
                thisView.$el.append(thisView.temp_children.grapharea.$el);
                thisView.$el.append(thisView.temp_children.minpanel.$el);
                thisView.$el.append(thisView.temp_children.botpanel.$el);
            }
            
            var showLegend = getPreference("LEGEND");
            if(showLegend === "t"){
                thisView.$el.append(thisView.temp_children.legend.$el);
            }
            
            if(appstate.get("sidepanelopen") === false){
                // Attach side bar
                thisView.$el.append(thisView.temp_children.sidebar.$el);
            }else{
                // Attach side panel
                thisView.$el.append(thisView.temp_children.sidepanel.$el);
            }
        },
        
        /**
         * Check to see if the side panel needs to be rendered. If so then 
         * check to see if it exists. If it does not exist then initialize and 
         * render it, otherwise let it handle itself.
         * 
         * @param {Backbone.Model} model
         * @param {Object} options
         */
        // sidePanelChanged: function(model, options){
        //     var thisView = this;
            
        //     // The side panel needs to be rendered
        //     if(thisView.model.get("sidepanelopen") === false){
        //         return Promise.resolve();
        //     }
            
        //     // The side panel view already exists
        //     if(thisView.model.get("views").hasOwnProperty("sidePanel")){
        //         return Promise.resolve();
        //     }
            
        //     // Initialize then render the sidepanel
        //     return thisView.initializeSidePanel().then(function(sidePanel){
        //         return sidePanel.render();
        //     });
        // }
    });
    
    pvt.activeSetChanged = function(model, options){
        var thisView = this;
        appstate.set("activeWindow", "standard");
    };
    
    /**
     * Cycles the color of the nodes whos IDs are currently in the targettedcircle set
     */
    pvt.cycleSelectedNodeColor = function(){
        var thisView = this;
        
        var activeNodeIDs = thisView.model.get("targettedcircles");
        assert(activeNodeIDs.length > 1);
        
        // Get the colors of all visible nodes
        var nodeColors = ActiveGraph.getNodeColor(thisView.model, activeNodeIDs.map(function(d){return d;}));
        
        // Get the graph state and active graph
        var graphState = application.graphstate;
        var activeGraph = graphState.get();
        
        nodeColors.forEach(function(n){
            var newColor = null;
            switch(n.color){
                case "red": newColor = "blue"; break;
                case "blue": newColor = "gray"; break;
                case "gray": newColor = "red"; break;
                default: throw Error("unknown color: " + n.color);
            }
            activeGraph.setNodeColor(n.node,newColor);
        });
        graphState.set(activeGraph);
        graphState.apply();
    };
    
    pvt.loadPrintGraph = function(){
        var thisView = this;
        
        function nodeClicked(id, node, e){}
        function iconClicked(id, icon){}
        function graphClicked(id, graph){}
        function edgeClicked(id, edge){}
        function shiftChanged(active){}

        var graphOptions = {
            overrides:{},
            handlers:[
                { type: "node",  evt: "click", response: nodeClicked  },
                { type: "icon",  evt: "click", response: iconClicked  },
                { type: "graph", evt: "click", response: graphClicked },
                { type: "edge",  evt: "click", response: edgeClicked  },
                { type: "node",  evt: "shift", response: shiftChanged }
            ]
        };

        application.svgs.print = application.svglib.allocate($("#print-div > svg")[0], graphOptions);
    };   
    
    
    
    return GraphWindowView;
});