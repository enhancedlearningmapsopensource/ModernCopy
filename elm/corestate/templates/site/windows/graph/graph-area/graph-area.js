/* global testSvgModule, application, appstate */

define([
        "text!./graph-area.html",
        "activeGraph",
        "jsclass!3rdParty/jsclass/",
        "constants",
        "backbone",
        "mustache",
        "./node-context-menu",
        "corestate/js/svg-interface/svg-interface",
        "hub-lib",
        "map-legend/map-legend"],
function (
          Template,
          ActiveGraph,
          JsClass,
          Constants,
          Backbone,
          Mustache,
          NodeContextMenu,
          SvgRender,
          Hub,
          MapLegend) {

    var pvt = {
        consts: {
            CONTEXT_MENU_CIRCLE: Constants.STRINGS.CIRCLE,
            CONTEXT_MENU_EDGE: Constants.STRINGS.EDGE,
            CONTEXT_MENU_ADD: "add to " + Constants.STRINGS.GRAPH,
            CONTEXT_MENU_ADD_NEW: "add to new " + Constants.STRINGS.GRAPH,
            CONTEXT_MENU_TEMPLATE_SEL: "#context-menu-template",
        }
    };

    var GraphAreaView = Backbone.View.extend({
        template: Template,
        events:{
            "click .parent-plus" : "delegateParentsClicked",
            "click .children-plus": "delegateChildrenClicked",
            "click .hourglass": "delegateHourglassClicked",
            "keydown" : "delegateKeyDown"
        },

        /**
         * Triggered when a user clicks on a circle
         * @param {type} id
         * @param {type} node
         * @return {Boolean}
         */
        delegateCircleClicked: function(id, node){
            var thisView = this;
            var mouseOptions = node.get("clickoptions");
            var multiselect  = application.multiselect;
            
            // Retask the event
            e = {
                pageX: mouseOptions.mouse.x,
                pageY: mouseOptions.mouse.y
            };
            $el = node.elem();

            // Get the graph state
            var graphState = application.graphstate;
            
            // Set the 'targetted' node to activate highlighting
            var targettedCircles    = appstate.get("targettedcircles");
            var prevTargetted       = targettedCircles.map(function(d){return d.id;}).join(",");
            
            // No multiselect 
            if(multiselect === false){
                // Show context menu for node
                NodeContextMenu(thisView, id, node);
                
                // Make this the only targetted circle
                targettedCircles.reset();
                targettedCircles.add({
                    id: id
                });
            }
            
            // If the 'shift' button is down or 'mutiselect' is otherwise on
            else{
                // Hide the context menu
                application.contextmenu.hide();
                
                if(targettedCircles.contains(id)){
                    targettedCircles.remove(id);
                }else{
                    targettedCircles.add({id: id});
                }
            }
            
            return false;
        },

        delegateEdgeClicked: function (id, edge) {
            var thisView = this;
            
            // Get mouse coords from options
            var mouseOptions = edge.get("clickoptions");
            
            // Retask the event
            var e = {
                pageX: mouseOptions.mouse.x,
                pageY: mouseOptions.mouse.y
            };

            // Context Menu
            var contextMenu = application.contextmenu;
            contextMenu
                .create(pvt.consts.CONTEXT_MENU_EDGE, "click", edge)
                .addItem(Constants.STRINGS.SELECT_EDGE, function () {
                    appstate.get("selectedcircles").reset();
                    appstate.get("targettedcircles").reset();
                    appstate.set({ 
                        selectededge: edge.get("src") + "-" + edge.get("tgt") + (edge.get("dir") ? "-d" : "")
                    });
                })
                .show(e);
            return false;
        },

        delegateHourglassClicked: function(e){
            var thisView = this;
            var $el = $(e.currentTarget);

            var lockID = lockSite(true, "graph-area.js::delegateHourglassClicked");

            var id = (!testSvgModule) ? Number($el.parents("g:first").attr("id").split("circle-")[1].trim()) : e;

            // Get the graph manager to save on calling model each time
            var graphManager = application.graphstate;
            var numMinimized = ActiveGraph.getOtherGraphs(thisView.model).length;
            
            // Set up the graph title for the new graph
            var graphDef = graphManager.get();
            var currentGraphTitle = getMapName({
                type: "hourglass",
                nodeid: id
            });

            // Get the current set of nodes that are visible
            var coloredNodes = ActiveGraph.getNodeColor(thisView.model,ActiveGraph.getNodes(thisView.model));
                    
            // Minimize active
            graphManager.pop();
            assert(graphManager.isEmpty());

            // Create new 
            var handle = graphManager.create(currentGraphTitle);
            assert(graphManager.push(handle));
            var graphDef = graphManager.get();

            // Add the node 
            graphDef.setNodeColor(id, coloredNodes.filter(function(d){return (d.node == id);})[0].color);

            //assert(graphManager.set(graphDef));
            //return graphManager.apply();

            var edgeFabricator = application.svglib.edgeFabricator();

            var parentLevels = Number(getPreference("HOUR_UP"));
            var childLevels = Number(getPreference("HOUR_DN"));

            var next = new JsClass.Set();
            var open = new JsClass.Set();
            var closed = new JsClass.Set();

            function traverse(relation, levels){
                // Determine recover function
                var recoverFunc = null;
                var addFunc = null;
                switch(relation){
                    case "children":
                        recoverFunc = edgeFabricator.getChildrenOf;
                        addFunc = graphDef.addParentOnlyNode;
                        break;
                    case "parents":
                        recoverFunc = edgeFabricator.getParentsOf;
                        addFunc = graphDef.addChildOnlyNode;
                        break;
                    default:
                        throw Error("unknown relation type: " + relation);
                }

                open.clear();
                open.add(Number(id));
                for (var l = 0; l < levels; l++) {
                    while (!open.isEmpty()) {
                        var curr = open.first();
                        open.remove(curr);
                        closed.add(curr);

                        var relativesOf = recoverFunc.call(edgeFabricator, curr);

                        if (relativesOf == null) {
                            continue;
                        }
                        relativesOf.forEach(function (relativeID) {
                            // If not already in the graph then add
                            if (!closed.contains(relativeID) && !open.contains(relativeID) && !next.contains(relativeID)) {
                                next.add(relativeID);
                                addFunc.call(graphDef, relativeID, curr);

                                // Check to see if it is in the old set so we can preserve the color
                                for (var os = 0; os < coloredNodes.length; os++) {
                                    if (coloredNodes[os].node === relativeID) {
                                        graphDef.setNodeColor(relativeID, coloredNodes[os].color);
                                        //inOldSet = true;
                                        break;
                                    }
                                }
                            }
                        });
                    }

                    while (!next.isEmpty()) {
                        var curr = next.first();
                        next.remove(curr);
                        open.add(curr);
                    }
                }
            }

            // Parents
            traverse("parents", parentLevels);

            // Children
            traverse("children", childLevels);

            assert(graphManager.set(graphDef));
            graphManager.apply();
            lockSite(false, lockID);
        },
        
        delegateKeyDown: function(e){
            throw Error();
        },

        /**
         * Triggered when a parent-plus is clicked
         */
        delegateParentsClicked: function(e){
            var thisView = this;
            var id = e;
            var hiddenParents = ActiveGraph.getHiddenParents(thisView.model, id);
            
            var graphManager = application.graphstate;
            assert(!graphManager.isEmpty());
            var graphDef = graphManager.get();
            for (var i = 0; i < hiddenParents.length; i++) {
                graphDef.addChildOnlyNode(hiddenParents[i], id);
            }
            graphManager.set(graphDef);
            graphManager.apply();
        },

        /**
         * Triggered when a children-plus is clicked
         */
        delegateChildrenClicked: function (e) {
            var thisView = this;
            var id = e;

            var hiddenChildren = ActiveGraph.getHiddenChildren(thisView.model, id);
            var graphManager = application.graphstate;
            
            assert(!graphManager.isEmpty());
            var graphDef = graphManager.get();
            
            for (var i = 0; i < hiddenChildren.length; i++) {
                graphDef.addParentOnlyNode(hiddenChildren[i], id);
            }
            
            graphManager.set(graphDef);            
            graphManager.apply();
        },
        
        /**
         * 
         * @returns {Promise}
         */
        getCombinedNodes: function(state, serverModel){
            var graphDefinition = state;
            var subgraph = serverModel;

            // Node defined by:
            // a) id
            // b) text
            // c) color
            // d) offset
            // e) parent (for parent-only nodes)
            // f) child (for child-only nodes)

            // Get the nodes to show
            var nodes = new JsClass.Hash();
            var alienNodes = []; 

            if (subgraph) {
                var colors = Object.keys(subgraph.get("nodes"));
                colors.forEach(function(color){
                    subgraph.get("nodes")[color].forEach(function(nodeModel){
                        // Get the decorated title. If there isn't a viable decorated title then grab the raw title
                        var text = nodeModel.has("decoratedTitle") ? nodeModel.get("decoratedTitle") : nodeModel.get("title");

                        // Add the node id if necessary
                        if(options.shownodeid){
                            text = nodeModel.get("textid") + " " + text;
                        }

                        // Create the new object and add it
                        var nodeOb = new NodeClass(nodeModel.id, color, text, 0, 0);    // id, color, text, x, y
                        nodes.store(nodeOb.id, nodeOb);
                    });
                });
            }
            
            // Remove nodes
            graphDefinition.removed.forEach(function (r) {
                if(nodes.hasKey(r)){
                    nodes.remove(r);
                }
            });

            // Get additional nodes that should be shown
            graphDefinition.additional.forEach(function (a) {
                var color = a.color;
                a.nodes.forEach(function (nid) {
                    if(nodes.hasKey(nid)){
                        nodes.remove(nid);
                    }
                    nodes.store(nid, new NodeClass(nid, color, "unknown", 0, 0));
                    alienNodes.push(nid);
                });
            });

            // Add parent-only nodes
            graphDefinition.parentOnly.forEach(function (r) {
                r.nodes.forEach(function (n) {
                    if(nodes.hasKey(n)){
                        nodes.remove(n);
                    }

                    var newNode = new NodeClass(n, "gray", "unknown", 0, 0);
                    newNode.parent = Number(r.parent);
                    nodes.store(newNode.id, newNode);
                    alienNodes.push(newNode.id);
                });
            });

            // Add child-only nodes
            graphDefinition.childOnly.forEach(function (r) {
                r.nodes.forEach(function (n) {
                    if(nodes.hasKey(n)){
                        nodes.remove(n);
                    }

                    var newNode = new NodeClass(n, "gray", "unknown", 0, 0);
                    newNode.child = Number(r.child);
                    nodes.store(newNode.id, newNode);
                    alienNodes.push(newNode.id);
                });
            });

            // Organize alien nodes
            removeDuplicates(alienNodes);

            // Get alien models
            var alienModels = alienNodes.map(function(d){
                return options.nodecol.get(d);
            });
            
            // Fix text
            alienModels.forEach(function(model){
                // Get the decorated title. If there isn't a viable decorated title then grab the raw title
                var text = model.has("decoratedTitle") ? model.get("decoratedTitle") : model.get("title");
                if(options.shownodeid){
                    text = model.get("textid") + " " + text;
                }
                nodes.fetch(model.id).text = text;
            });
            
            // Return nodes
            return Promise.resolve(nodes.map(function(nodeItem){
                return nodeItem.value;
            }));
        },

        initialize: function () {
            var thisView = this;
            Mustache.parse(thisView.template);
            
            var mapLegend = new MapLegend({
                id: "map-legend"
            });
            mapLegend.render();

            //thisView.$el = $(thisView.el);

            // Load the main template
            //var template = thisView.$el.find(pvt.consts.CONTEXT_MENU_TEMPLATE_SEL).html();
            //Mustache.parse(thisView.template);
            /*if (typeof template === 'undefined' || template === null) {
                throw Error("invalid template");
            }*/
            //application.mustache.graphAreaContextMenu = template;
            var renderOb = {};
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            thisView.$el.append(mapLegend.$el);
            
            pvt.allocateGraph.call(thisView);

            thisView.listenTo(appstate, "change:activeGraph", pvt.activeGraphChanged);
            thisView.listenTo(appstate, "change:activeSubject", thisView.render);
            thisView.listenTo(appstate, "change:activeWindow", thisView.render);
            thisView.listenTo(appstate, "change:activeSet", pvt.activeSetChanged);
            thisView.listenTo(appstate.get("selectedcircles"), "update", thisView.render);
            thisView.listenTo(appstate.get("selectedcircles"), "reset", thisView.render);
            thisView.listenTo(appstate.get("targettedcircles"), "update", thisView.render);
            thisView.listenTo(appstate.get("targettedcircles"), "reset", thisView.render);
            thisView.listenTo(appstate, "change:selectededge", thisView.render);
            thisView.listenTo(appstate, "change:activeGraphTransform", thisView.render);
            thisView.listenTo(appstate, "change:sidePanel", thisView.render);
            thisView.listenTo(appstate, "change:menuOpen", thisView.render);
            thisView.listenTo(appstate, "change:edgegraphready", pvt.allocateGraph);
            thisView.listenTo(Hub.get("userpreference"), "change", pvt.changeUserPreference);
        },

        load: function(){
            var thisView = this;
            if(testSvgModule){
                return Promise.resolve(true);
            }else{
                return thisView.model.get("views").activeGraphView.load();
            }
        },
        
        renderDelegate: function(){
            this.render();
        },

        /**
         * @param {object} options
         * @param {bool=false} options.forceRender - forces the graph to re-render
         */
        render: function (model, options) {            
            var thisView = this;
            options = (!options) ? {} : options;
            
            // Get program state variables
            var actWindow = appstate.get("activeWindow");
            var actSubject = appstate.get("activeSubject");
            var graphID = ActiveGraph.getGraphID(appstate);
            const sidePanel = appstate.get("sidePanel");
            
            var renderCond = (actWindow === "graph");
            renderCond &= ((actSubject) !== null);
            renderCond &= (typeof graphID !== 'undefined');
            renderCond &= (graphID !== null);
            renderCond &= (sidePanel !== Constants.STRINGS.CASCADE);            
            
            // Show and render graph
            if(renderCond){
                // Validate graph id
                assert((typeof graphID === 'string' || typeof graphID === 'number'), "invalid graph id: " + graphID);
                
                // Show the graph
                thisView.$el.show();
                
                // Resize to other controls
                thisView.resize();
                
                // Render the graph
                return SvgRender(application.graphstate.handle(), appstate, 'active', options);
            }
            
            // Hide all content
            else{
                thisView.$el.hide();
                return Promise.resolve(false);
            }
            
        },

        resize: function () {
            var thisView = this;

            // Update the DOM according to whether a node is selected
            var selectedCircle = appstate.get("selectedcircles");
            var selectedEdge = appstate.get("selectededge");
            if (selectedCircle.length === 0 && selectedEdge === null) {
                thisView.$el.removeClass("bottom-open");
            } else {
                thisView.$el.addClass("bottom-open");
            }


            // Update the DOM according to whether the side panel is open
            var sidePanelOpen = appstate.get("sidepanelopen");
            if (sidePanelOpen === false) {
                thisView.$el.removeClass("side-panel-open");
            } else {
                thisView.$el.addClass("side-panel-open");
            }

            // Update the DOM according to whether the menu panel is open
            var menuOpen = appstate.get("menuOpen");
            if (!menuOpen) {
                thisView.$el.removeClass("menu-open");
            } else {
                thisView.$el.addClass("menu-open");
            }
        },

        userChanged:function(model, options){
            var thisView = this;
            thisView.render(null, {forceRender: true});
        }
    });

    pvt.allocateGraph = function(){
        var thisView = this;
        
        // Check for edge fabricator
        if(typeof application.svglib._fabricator === 'undefined' || application.svglib._fabricator === null){
            return; // Cannot allocate without edge fabricator
        }
        
        // Check for already allocated
        if(application.svgs.active){
            return; // Don't need to allocate. Already done.
        }
        
        function nodeClicked(id, node, e){
            if(node.get("clicked") && node.get("clickoptions").button === 0){
                thisView.delegateCircleClicked(id, node);
            }
        }

        function iconClicked(id, icon){
            if(icon.get("clicked")){
                if(typeof icon.get("class").find(function(d){ return (d == "parent-svg-plus");}) !== 'undefined'){
                    thisView.delegateParentsClicked(id);
                }else if(typeof icon.get("class").find(function(d){ return (d == "child-svg-plus");}) !== 'undefined'){
                    thisView.delegateChildrenClicked(id);
                }else if(typeof icon.get("class").find(function(d){ return (d == "svg-hourglass");}) !== 'undefined'){
                    thisView.delegateHourglassClicked(id);
                }else{
                    throw Error("unknown icon class");
                }
            }
        }

        function graphClicked(id, graph){
            if(graph.get("clicked")){
                appstate.set("graphClicked", {id: id, graph: graph});
            }
        }

        function edgeClicked(id, edge){
            if(edge.get("clicked")){
                thisView.delegateEdgeClicked(id, edge);
            }
        }

        function shiftChanged(id, graph){
            console.log("shift: " + graph.get("shift"));
            application.multiselect = graph.get("shift");
        }

        var graphOptions = {
            overrides:{
                node: application.svglib.getIconNodeConstructor()
            },
            handlers:[
                { type: "node",  evt: "click", response: nodeClicked  },
                { type: "icon",  evt: "click", response: iconClicked  },
                { type: "graph", evt: "click", response: graphClicked },
                { type: "edge",  evt: "click", response: edgeClicked  },
                { type: "graph", evt: "shift", response: shiftChanged }
            ]
        };

        application.svgs.active = application.svglib.allocate(thisView.$el, graphOptions);
    };
    
    pvt.changeUserPreference = function(model, options){
        var thisView = this;
        var preferenceID = model.get("preferenceid");
        
        var code = Hub.get("preference").get(preferenceID).get("program_code");
        if(code === "NODEID_ON" || code === "INDIR_ON" || code === "MINNDFONT"){
            thisView.render();
        }
    };
    
    pvt.activeGraphChanged = function(model, options){
        var thisView = this;
        if(appstate.has("targettedcircles")){
            appstate.get("targettedcircles").reset();
        }
        thisView.render();
    },
            
    pvt.activeSetChanged = function(model, options){
        var thisView = this;
        application.graphstate.destroy();
        application.graphstate.apply();
        if(appstate.has("selectedcircles")){
            appstate.get("selectedcircles").reset();
        }
        if(appstate.has("targettedcircles")){
            appstate.get("targettedcircles").reset();
        }
    };

    return GraphAreaView;
});