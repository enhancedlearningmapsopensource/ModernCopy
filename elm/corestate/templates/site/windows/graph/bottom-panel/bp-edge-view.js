define(["backbone",
        "mustache",
        "activeGraph",
        "text!./bottom-panel-edge-template.html",
        "jsclass!3rdParty/jsclass/",
        "hub-lib"],
function(Backbone,
         Mustache,
         ActiveGraph,
         Template,
         JsClass,
         Hub){
             
    var pvt = {
        consts: {
            DOM_MUSTACHE: "#bottom-panel-template",
            DOM_MUSTACHE_EDGE: "#bottom-panel-edge-template",
            DOM_TITLE: "#bot-header-col",
            DOM_DESCRIPTION: ".content-container > #bot-content > .col-xs-12 > #description > .col-xs-12",
            DOM_CONTENT: ".content-container > #bot-content",
            NODE_ID: "bot-node-",
            EDGE_ID: "bot-edge-",
        }
    };
             
    var BottomPanelEdgeView = Backbone.View.extend({
        template: Template,
        events:{
            "click #show-edge-hidden" : "delegateShowHidden",
            "click .bottom-c-icon": "delegateClickCircle",
            "mouseover .edge-panel-node-row": "delegateHoverStart",
            "mouseout .edge-panel-node-row": "delegateHoverStop",
            "click a.bot-edge": "delegateSelectNode"
        },
        
        delegateClickCircle: function(e){
            var thisView = this;
            e.preventDefault();
            
            var idArr = $(e.currentTarget).attr("id").split("-");
            var id = Number(idArr[1]);
            var color = idArr[0];
            
            var graphState = application.graphstate;
            var graphDef = graphState.get();
            
            switch(color){
                case "SbluM":
                    graphDef.setNodeColor(id, "blue");
                    break;
                case "SredM":
                    graphDef.setNodeColor(id, "red");
                    break;
                case "SgreM":
                    graphDef.setNodeColor(id, "gray");
                    break;
                default:
                    throw Error("Unknown color: " + color);
            }
            
            graphState.set(graphDef);
            graphState.apply();
        },
        
        delegateHoverStart: function(e){
            var thisView = this;
            e.preventDefault();
            
            var $el = $(e.currentTarget);
            var nodeID = Number($el.attr("id").split("edge-panel-node-")[1]);
            
            highlightNode(nodeID);   
        },
        
        delegateHoverStop: function(e){
            var thisView = this;
            e.preventDefault();
            $("g > circle").each(function(c){
                $(this).attr("fill", "white");
            });
        },
        
        delegateSelectNode: function(e){
            var thisView = this;
            e.preventDefault();
            var nodeID = Number($(e.currentTarget).attr("id").split("bot-edge-")[1]);
            appstate.set("selectededge", null);
            appstate.get("selectedcircles").add({id: nodeID});
        },
        
        delegateShowHidden: function(e){
            var thisView = this;
            e.preventDefault();
            
            var grayNodesBetween = pvt.getHiddenNodes.call(thisView);
            
            var graphManager = application.graphstate;
            var graphDef = graphManager.get();
            grayNodesBetween.filter(function(d){
                return (d.color === "gray");
            }).forEach(function(d){
                graphDef.setNodeColor(d.node, "gray");
            });
            graphManager.set(graphDef);
            var lockID = lockSite(true, "bp-edge-view.delegateShowHidden");
            graphManager.apply();
            lockSite(false, lockID);
        },
        
        initialize: function(){
            var thisView = this;
            Mustache.parse(thisView.template);
            thisView.model = new Backbone.Model({
                id: "bottompaneledgemodel"
            });
            thisView.listenTo(appstate, "change:selectededge", thisView.render);
            thisView.listenTo(appstate, "change:activeGraph", thisView.render);
        },
        
        edgeTitle: function(){
            var thisView = this;
            var edgeSelected    = appstate.get("selectededge");
            var edgeSplit = edgeSelected.split('-');
            
            var source = Number(edgeSplit[0].trim());
            var target = Number(edgeSplit[1].trim());
            var conceals = (edgeSplit.length > 2 && edgeSplit[2] == 'd');
            
            var nodeCollection = Hub.get("node");
            
            // Get source/target data
            source = nodeCollection.get(source);
            target = nodeCollection.get(target);
            
            var pref = getPreference("NODEID_ON");
            if(pref === null){
                throw Error("Cannot find preference: NODEID_ON");
            }
            var showNodeID = (pref.localeCompare("t") === 0);
            
            return {
                title: Hub.wrap(source).title(true, showNodeID) + " <span class='glyphicon glyphicon-arrow-right'></span> " + Hub.wrap(target).title(true, showNodeID),
                description: (conceals) ? "indirect connection" : "required"
            };
        },
        
        render: function(){
            var thisView = this;
            
            // Get the program state & significant properties
            var programState    = appstate;
            var edgeSelected    = programState.get("selectededge");
            var dataInterface   = application.datainterface;
            
            // Conditions to hide element and exit the render
            var exitConditions  = false;
            exitConditions |= (edgeSelected === null);  // If edge selected is null then exit
            
            // Exit if necessary
            if(exitConditions){
                thisView.$el.hide();
                return;
            }
            
            var pref = getPreference("NODEID_ON");
            if(pref === null){
                throw Error("Cannot find preference: NODEID_ON");
            }
            var showNodeID = (pref.localeCompare("t") === 0);

            // Fetch the edge
            var edgeSplit = edgeSelected.split('-');
            var currEdge = {
                edge: {
                    source: Number(edgeSplit[0].trim()),
                    target: Number(edgeSplit[1].trim()),
                    conceals: (edgeSplit.length > 2 && edgeSplit[2] == 'd')
                },
                tree: null,
                title: null,
                subtitle: null,
                nodes: null,
                nodeTemplates: []
            };

            pvt.getNodesBetweenEnds.call(thisView, currEdge);

            var nodesMissing = currEdge.tree.map(function(d){
                return d;
            });
            
            var nodeCollection = Hub.get("node");
            
            // Get source/target data
            currEdge.edge.source = nodeCollection.get(currEdge.edge.source);
            currEdge.edge.target = nodeCollection.get(currEdge.edge.target);
            
            var nodeColors = (nodesMissing.length > 0) ?
                pvt.getVisibleNodeColors.call(thisView, nodesMissing).map(function(d){
                    return {
                        id: d.node,
                        model: nodeCollection.get(d.node),
                        color: d.color
                    };
                }) : [];
            
            /// Get the source and target nodes
            var source = currEdge.edge.source;
            var target = currEdge.edge.target;

            // Get the title and description
            currEdge.title = Hub.wrap(source).title(true, showNodeID) + " <span class='glyphicon glyphicon-arrow-right'></span> " + Hub.wrap(target).title(true, showNodeID);
            currEdge.description = (currEdge.edge.conceals) ? "indirect connection" : "required";

            // Map to template
            currEdge.nodeTemplates = nodeColors.map(function(d){
                // Get the title of the node
                var title = d.model.get("title").replaceAll("[i]","<em>").replaceAll("[/i]","</em>");
                if(showNodeID){
                    title = d.model.get("textid") + " - " + title;
                }

                // Create template object
                return {
                    linkid: d.id,
                    nodetitle: title,
                    colorgray: (d.color == "gray"),
                    colorred: (d.color == "red"),
                    colorblue: (d.color == "blue"),
                };
            });

            currEdge.nodeTemplates.sort(function(a,b){
                return a.nodetitle.localeCompare(b.nodetitle);
            });

            // Format for template
            var table = {};
            table.title = currEdge.title;
            table.description = currEdge.subtitle;
            table.nodes = currEdge.nodeTemplates;
            table.numnodes = currEdge.nodeTemplates.length;

            var $el = $(Mustache.render(thisView.template, table));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            //thisView.$el.find(pvt.consts.DOM_TITLE).html(currEdge.title);
            thisView.$el.find(pvt.consts.DOM_DESCRIPTION).html(currEdge.subtitle);
            
            //$(".bot-header-col").html(table.title);
            //thisView.$el.find(pvt.consts.DOM_CONTENT).html(Mustache.render(thisView.template, table));
        }
    });
    
    
    /**
     * Get all nodes between the endpoints of the given edge
     * @param {Object} edge
     */
    pvt.getNodesBetweenEnds = function(edge){
        var thisView = this;
        
        // Get the intersection of the upper and lower bfs trees
        var edgeFabricator = application.svglib.edgeFabricator();
        var treeNodes = edgeFabricator.edgeGraph.tree([edge.edge.source, edge.edge.target], "IN").k;
        edge.tree = [];
        treeNodes.forEach(function (nodeid) {
            if (nodeid != edge.edge.source && nodeid != edge.edge.target) {
                edge.tree.push(nodeid);
            }
        });
    };
    
    /**
     * @typedef {Object} NodeColor
     * @property {number} node - the node id
     * @property {string} color - the node color
     * 
     * @param {number[]} nodes - ids of nodes we care about
     * @returns {Promise<NodeColor[]>} - array of VISIBLE nodes and colors from the given set
     */
    pvt.getVisibleNodeColors = function(nodes){
        var thisView = this;
        
        // Make set of all useful nodes
        var nodeSet = new JsClass.Set(nodes.map(function(d){return d;}));
        var invisibleReq = [];
        
        var visibleNodes = ActiveGraph.getNodes(thisView.model);
        
        // Only keep the ones we care about
        var visibleReq = (new JsClass.Set(visibleNodes)).intersection(nodeSet);

        // Non-visible required
        invisibleReq = nodeSet.difference(visibleReq).toArray();

        var nodeColors = ActiveGraph.getNodeColor(thisView.model, visibleReq.toArray());

        return nodeColors.concat(invisibleReq.map(function(d){
            return {
                node: d,
                color: "gray"
            };
        }));
    };
    
    pvt.getHiddenNodes = function(){
        var thisView = this;
        var edgeSelected = appstate.get("selectededge");
        var edgeSplit = edgeSelected.split('-');
        var currEdge = {
            edge: {
                source: Number(edgeSplit[0].trim()),
                target: Number(edgeSplit[1].trim()),
                conceals: (edgeSplit.length > 2 && edgeSplit[2] == 'd')
            }
        };
        pvt.getNodesBetweenEnds.call(thisView, currEdge);
        return pvt.getVisibleNodeColors.call(thisView, currEdge.tree);
    };
    
    return BottomPanelEdgeView;
})

