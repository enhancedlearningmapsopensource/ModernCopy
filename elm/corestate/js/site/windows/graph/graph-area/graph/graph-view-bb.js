/* global lockSite */

﻿﻿define(["backbone",
        //"backbonehammerjs",
        "corestate/js/graphs/renderer/graph-renderer",
        "corestate/js/graphs/node-class"],
function (Backbone,
          //BackboneHammer,
          GraphRenderer,
          Node) {

    var pvt = {
        consts: {
            CONTEXT_MENU_NAME: "circle",
        }
    }

    var GraphView = Backbone.View.extend({
        initialize: function () {
            var thisView = this;
            Backbone.View.prototype.initialize.apply(thisView);

            thisView.$el = $(thisView.el);
            thisView.model.get("graphRenderers").store(thisView.id, new GraphRenderer(thisView.$el, thisView.id));
        },

        load: function(){
            var thisView = this;
            return thisView.model.get("graphRenderers").fetch(thisView.id).load();
        },

        render: function (graphStateID, options) {
            var thisView = this;
            if(typeof lockSite === 'function'){
                var lockID = lockSite(true, "graph-view-bb.js::render");
            }
            
            return thisView.renderWrapper(graphStateID, options).then(function(ret){
               lockSite(false, lockID);
               return Promise.resolve(ret);
            });
        },
        
        renderWrapper: function(graphStateID, options){
            var thisView = this;

            // Check to make sure the graph window is open
            var activeSubject = thisView.model.get("activeSubject");
            if(thisView.model.get("activeWindow") == "standard" || activeSubject === null){
                return Promise.resolve(false);
            }

            // Get the caller in case we need to tack them down
            //var caller = getCaller();

            // Define options and set defaults
            options = (typeof options === 'undefined' || options === null) ? {} : options;
            options.forceRender = (typeof options.forceRender === 'undefined' || options.forceRender === null) ? false : options.forceRender;

            // Ensure a valid graph state id
            graphStateID = (typeof graphStateID !== 'string' || graphStateID === null) ? application.graphstate.activeGraph : graphStateID;
            if (graphStateID == null) {
                return Promise.resolve(false);
            }

            // Get the graph
            var activeGraph = application.graphstate.getGraphFromID(graphStateID);

            // Get the associated graph renderer, definition, and url
            var graphRenderer = thisView.model.get("graphRenderers").fetch(thisView.id);
            var graphDefUrl = activeGraph.definition.toUrl();
            var graphStateUrl = activeGraph.toUrl();

            // Check and set a flag indicating whether the graph is the active graph
            options.isActiveGraph = (thisView.id == "active-graph-view" || thisView.id == 'graph-print-view');
            options.programState = thisView.model;

            // Enforce transform
            assert(options.hasOwnProperty("transform") && options.transform !== null, "No transform provided");

            // We have already rendered the graph so do not do so again. Instead refresh it if needed
            if (graphRenderer.renderDef == graphDefUrl && !options.forceRender) {
                graphRenderer.refresh(options);
                return Promise.resolve(true);

            // The graph is not currently loaded so check to see if its already being loaded
            }else if(graphRenderer.nextRenderDef == graphDefUrl && !options.forceRender){
                // Graph is currently being loaded so just ignore this render call
                return Promise.resolve(false);
                
            // There is a different graph so load it
            }else{
                // Load the graph
                // Set the next render definition 
                graphRenderer.nextRenderDef = graphDefUrl;

                // Get the subgraph
                return pvt.getSubgraph.call(thisView, activeGraph.definition.graphID, activeSubject)
                .then(function (subgraph) {
                    // Get the nodes
                    return pvt.getNodes.call(thisView, activeGraph.definition, subgraph);
                })
                .then(function(nodes){
                    // Validate the node set
                    nodes.forEach(function(n){
                        if(n.text === 'unknown'){
                            throw Error("text cannot be unknown at this stage");
                        }
                    });

                    // Get the fabricator
                    var edgeFabricator = thisView.model.get("edgeFabricator");

                    // Determine the edges
                    var edges = pvt.getEdges.call(thisView, edgeFabricator, nodes, graphRenderer, options);

                    // Plan the graph 
                    var graphPlanner = application.graphstate.planner;
                    var dagreGraph = graphPlanner.planGraph(edges, nodes);

                    options.layout = dagreGraph;
                    options.edges = edges;
                    options.nodes = nodes;
                    options.renderDef = graphDefUrl;
                    options.renderState = graphStateUrl;

                    // Render the graph
                    return pvt.renderGraph.call(thisView, options);
                })
                .then(function(){
                    console.log("GraphView ID: " + thisView.id);
                    console.log("GraphRenderer exists: " + thisView.model.get("graphRenderers").fetch(thisView.id) !== null);

                    // Indicate that the graph is loaded and is ready to render
                    if(graphDefUrl == graphRenderer.nextRenderDef){
                        graphRenderer.renderDef = graphRenderer.nextRenderDef;
                        return Promise.resolve(true);
                    }
                    
                    // Looks like the required graph changed while we were loading it so cancel the render
                    else{
                        return Promise.resolve(false);
                    }
                });
            }
        }
    });

    /**
     * Get the edges to display on the current graph given the node string.
     * 
     * @param {object} fabricator - the edge fabricator
     * @param {object} nodeSet - the array containing the node objects
     * @param {string} renderer - the graph renderer
     * @param {object} options
     * @param {bool} options.forceRender - forces a re-render
     * @return {array} - list of edges that connect the given node set
     */
    pvt.getEdges = function (fabricator, nodeSet, renderer, options) {
        var thisView = this;
        var grayNodes = [];
        var coloredNodes = [];
        
        // There are no nodes so return no edges
        if(nodeSet.length == 0){
            return [];
        }

        nodeSet.forEach(function(d){
            if(d.color == "gray"){
                grayNodes.push(d.id);
            }else{
                coloredNodes.push(d.id);
            }
        });

        var forceRender = (options && options.forceRender) ? options.forceRender : false;
        var checkString = coloredNodes.sort().join(",") + "-g-" + grayNodes.sort().join(",");

        var rendererNodeString = renderer.nodeString;
        if (checkString != rendererNodeString || forceRender) {
            var nodeString = nodeSet.map(function (d) { return d.id; }).sort().join(",");
            renderer.nodeString = checkString;

            // Get user preference for dashed edges
            var showIndirect = (thisView.model.get("user").getPreference("Show Indirect (Dashed) Connections") == "t") ? true : false;

            // Fabricate edges
            var edges = fabricator.getStructure(nodeString, showIndirect);

            var edgeString = JSON.stringify(edges);

            //console.log("edges fabricated");
            for (var i = 0; i < edges.length; i++) {
                var d = edges[i];

                // Get the source
                var source = d.source;
                for (var s = 0; s < nodeSet.length; s++) {
                    if (nodeSet[s].id == source) {
                        source = nodeSet[s];
                        break;
                    }
                }

                // Get the target
                var target = d.target;
                for (var t = 0; t < nodeSet.length; t++) {
                    if (nodeSet[t].id == target) {
                        target = nodeSet[t];
                        break;
                    }
                }

                var parentChildOk = false;
                if (source.child === null && target.parent === null) {
                    parentChildOk = true;
                } else {
                    if (source.child !== null && target.parent !== null) {
                        if (source.child === target.id && target.parent == source.id) {
                            parentChildOk = true;
                        }
                    } else if (source.child !== null && source.child == target.id) {
                        parentChildOk = true;
                    } else if (target.parent !== null && target.parent == source.id) {
                        parentChildOk = true;
                    }
                }

                if (parentChildOk) {
                    d.id = d.source + "-" + d.target + (d.hasOwnProperty("conceals") ? "-d" : "");
                } else {
                    edges.splice(i, 1);
                    i--;
                }
            }
            renderer.prevEdgeSet = edges;
        } else {
            edges = renderer.prevEdgeSet;
        }

        
        return edges;
    }

    pvt.getNodes = function (definition, subgraph) {
        var thisView = this;
        var graphDefinition = definition;

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

                    var showNodeID = (thisView.model.get('user').getPreference("Show NodeID") == "t");
                    if(showNodeID){
                        text = nodeModel.get("textid") + " " + text;
                    }

                    if(text === "unknown"){
                        throw Error("unknown text");
                    }

                    // Create the new object and add it
                    var nodeOb = new Node(nodeModel.id, color, text, 0, 0);    // id, color, text, x, y
                    nodes.store(nodeOb.id, nodeOb);
                })
            });

            // Remove duplicates
            //removeDuplicates(nodes, function(d){return d.id;});
        }

        

        // Remove nodes
        graphDefinition.removed.forEach(function (r) {
            if(nodes.hasKey(r)){
                nodes.remove(r);
            }
        });

        // 

        // Get additional nodes that should be shown
        graphDefinition.additional.forEach(function (a) {
            var color = a.color;
            a.nodes.forEach(function (nid) {
                if(nodes.hasKey(nid)){
                    nodes.remove(nid);
                }
                nodes.store(nid, new Node(nid, color, "unknown", 0, 0));
                alienNodes.push(nid);
            });
        });

        // Add parent-only nodes
        graphDefinition.parentOnly.forEach(function (r) {
            r.nodes.forEach(function (n) {
                if(nodes.hasKey(n)){
                    nodes.remove(n);
                }
                
                var newNode = new Node(n, "gray", "unknown", 0, 0);
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
                
                var newNode = new Node(n, "gray", "unknown", 0, 0);
                newNode.child = Number(r.child);
                nodes.store(newNode.id, newNode);
                alienNodes.push(newNode.id);
            });
        });

        // Organize alien nodes
        removeDuplicates(alienNodes);

        // Get alien models
        return thisView.model.get("managers").get("node", alienNodes).then(function(alienModels){
            alienModels.forEach(function(model){
                // Get the decorated title. If there isn't a viable decorated title then grab the raw title
                var text = model.has("decoratedTitle") ? model.get("decoratedTitle") : model.get("title");

                var showNodeID = (thisView.model.get('user').getPreference("Show NodeID") == "t");
                if(showNodeID){
                    text = model.get("textid") + " " + text;
                }

                if(text === "unknown"){
                    throw Error("unknown text");
                }

                nodes.fetch(model.id).text = text;
            });
            return Promise.resolve(nodes.map(function(nodeItem){
                return nodeItem.value;
            }));
        });
    }

    /**
     * @param {(string|number)} graphID
     * @param {string} subject
     * @returns {Promise(null|SubgraphModel)}
     */
    pvt.getSubgraph = function (graphID, subject) {
        var thisView = this;
        if(typeof graphID === 'undefined' || graphID === null){
            return Promise.resolve(null);
        }
        assert((typeof graphID === 'string' || typeof graphID === 'number'), "invalid graph id: " + graphID);
        
        return application.subgraphsearch.create(subject).addTerm(graphID).searchOne();
    }

    pvt.search = function (graphID, subject) {
        throw Error("deprecated 5/13/2017");
        var thisView = this;

        /**
         * Get records whose fields contain the given string
         * @param {string} recordType - type of record (e.g. node, standard)
         * @param {array<string>} fieldsToMatch - fields to check for a string match
         * @param {string} strToMatch - the string to match against
         * @return {Promise(array)} - an array of Models whose given fields match the given string
         */
        function getRecordsMatchingString(recordType, fieldsToMatch, strToMatch){
            return new Promise(function(resolve, reject){
                // Get matching standards
                var manager = thisView.model.get("managers");
                var records = manager.managers.fetch(recordType);

                var searchOb = {};
                fieldsToMatch.forEach(function(field){
                    searchOb[field] = strToMatch;
                });

                records = records.search(searchOb);
                resolve(records);
            });
        }

        function getStandardsMatchingString(){
            return getRecordsMatchingString("standard", ["textid","description"], graphID);
        }

        function getNodesMatchingString(){
            return getRecordsMatchingString("node", ["title","shorttitle", "textid", "summary"], graphID);
        }

        function getMapsMatchingString(){
            return getRecordsMatchingString("map", ["title"], graphID);
        }

        var sync = {
            numericMatch: null,
            directMatch:{
                standards: null,
                nodes: null,
                maps: null
            },
            standardMatch:{
                nodes: null,
                maps: null
            },
            nodeMatch:{
                maps: null,
            }
        }
        
        // Is the graph id numeric?
        if($.isNumeric(graphID)){
            var subgraphCollection = thisView.model.get("datainterface").get("subgraph");
            sync.numericMatch = subgraphCollection.get(graphID);
            return Promise.resolve(sync);
        }else{
            // Get all direct string matches
            var concurrent = Promise.all([getStandardsMatchingString(), getNodesMatchingString(), getMapsMatchingString()]);
            return concurrent.then(function(concurrentResults){
                sync.directMatch.standards  = concurrentResults[0];
                sync.directMatch.nodes      = concurrentResults[1];
                sync.directMatch.maps       = concurrentResults[2];

                sync.standardMatch.nodes = [];
                sync.standardMatch.maps = [];
                sync.nodeMatch.maps = [];


                // Get node ids and map ids from standards
                sync.directMatch.standards.forEach(function(standardModel){
                    if(standardModel.has("nodes")){
                        standardModel.get("nodes").forEach(function(nodeID){
                            sync.standardMatch.nodes.push(nodeID);
                        });
                    }
                    if(standardModel.has("maps")){
                        standardModel.get("maps").forEach(function(mapID){
                            sync.standardMatch.maps.push(mapID);
                        });
                    }
                });

                // Get map ids from nodes
                sync.directMatch.nodes.forEach(function(nodeModel){
                    if(nodeModel.has("maps")){
                        var colors = Object.keys(nodeModel.get("maps"));
                        colors.forEach(function(color){
                            nodeModel.get("maps")[color].forEach(function(mapID){
                                sync.nodeMatch.maps.push(mapID);
                            });
                        });
                    }
                });

                // Remove duplicates in case
                removeDuplicates(sync.nodeMatch.maps, function(d){return d;});

                // Set up the ID search
                var idSearch = [];
                var manager = thisView.model.get("managers");
                if(sync.standardMatch.nodes.length > 0){
                    idSearch.push(manager.get("node", sync.standardMatch.nodes));
                }else{
                    idSearch.push(Promise.resolve([]));
                }

                if(sync.standardMatch.maps.length > 0){
                    idSearch.push(manager.get("subgraph", sync.standardMatch.maps));
                }else{
                    idSearch.push(Promise.resolve([]));
                }

                if(sync.nodeMatch.maps.length > 0){
                    idSearch.push(manager.get("subgraph", sync.nodeMatch.maps));
                }else{
                    idSearch.push(Promise.resolve([]));
                }

                return Promise.all(idSearch);
            })
            .then(function(idSearchResults){
                var k = 0;
                sync.standardMatch.nodes    = idSearchResults[0];
                sync.standardMatch.maps     = idSearchResults[1];
                sync.nodeMatch.maps         = idSearchResults[2];

                return Promise.resolve(sync);
            });
        }
    }

    pvt.renderGraph = function(options){
        var thisView = this;

        // Validate the node set
        var nodes = options.nodes;
        nodes.forEach(function(n){
            if(n.text === 'unknown'){
                throw Error("text cannot be unknown at this stage");
            }
        })

        // Render the graph
        console.log("rendering graph");
        return thisView.model.get("graphRenderers").fetch(thisView.id).render(options);
    }
    

    return GraphView;
});
