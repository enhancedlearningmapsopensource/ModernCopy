define(["core",
        "mustache",
        "text!./node-row.html",
        "jsclass!3rdParty/jsclass/",
        "activeGraph"], 
function(Core,
         Mustache,
         Template,
         JsClass,
         ActiveGraph){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {
            "mousedown": "delegateCaptureMouseDown",
            "click": "delegateClick"
        },
        
        delegateCaptureMouseDown: function(e){
            return false;
        },
        
        delegateClick: function(){
            var color = null;
            var thisView = this;
            var nodeIDs = thisView.model.get("nodes");
            var graphManager = application.graphstate;
            var type = thisView.model.get("match").split("(")[1].split(")")[0];
            
            switch(thisView.model.get("operation")){
                case "keyword":
                    // Open a blank graph
                    color = "red";
                    ActiveGraph.set(thisView.model, ("_SEARCHTERM ("+type+")"), {update: false, close: true});
                    break;
                case "include":
                    color = "gray";
                    if(!graphManager.isEmpty()){
                        var graphDefinition = graphManager.get();
                        var graphNodes = new JsClass.Set(graphDefinition.getNodeIDs());

                        // Get 'any' node ides
                        nodeIDs = thisView.model.get("nodes").difference(graphNodes).map(function(d){
                            return d;
                        });
                    }
                    break;
                default:
                    throw Error("Unknown operation: " + thisView.model.get("operation"));
            }

            /*switch (id) {
                case "keywords-any":
                    // Set render vars
                    color = "red";

                    nodeIDs = result.nodes.any.map(function(d){
                        return d;
                    });


                    // Open a blank graph
                    ActiveGraph.set(thisView.model, ("_" + thisView.$el.find(pvt.consts.DOM_TEXTBOX).val() + "(any)"), {update: false, close: true});

                    break;
                case "keywords-all":
                    // Set render vars
                    color = "red";

                    nodeIDs = result.nodes.all.map(function(d){
                        return d;
                    });

                    // Open a blank graph
                    ActiveGraph.set(thisView.model, ("_" + thisView.$el.find(pvt.consts.DOM_TEXTBOX).val() + "(or)"), {update: false, close: true});
                    break;
                case "include-any":
                    color = "gray";

                    if(!graphManager.isEmpty()){
                        var graphDefinition = graphManager.get();
                        var graphNodes = new JsClass.Set(graphDefinition.getNodeIDs());

                        // Get 'any' node ides
                        nodeIDs = result.nodes.any.difference(graphNodes).map(function(d){
                            return d;
                        });
                    }
                    break;
                case "include-all":
                    // Set render vars
                    color = "gray";
                    if(!graphManager.isEmpty()){
                        var graphDefinition = graphManager.get();
                        var graphNodes = new JsClass.Set(graphDefinition.getNodeIDs());

                        // Get 'any' node ides
                        nodeIDs = result.nodes.all.difference(graphNodes).map(function(d){
                            return d;
                        });
                    }
                    break;
                default:
                    throw Error("Unknown id: " + id);
            }*/

            var graphDef = graphManager.get();
            graphDef.graphID = (graphDef.graphID[0] === "_") ? "_custom" : graphDef.graphID;

            // Add necessary nodes
            if (nodeIDs.length > 0) {
                // Add the nodes
                nodeIDs.forEach(function (nid) {
                    graphDef.setNodeColor(nid, color);
                });

                // Update the program
                graphManager.set(graphDef);
                graphManager.apply({activeWindow: "graph", omniSearchOpen: false});

                // Since the graph has changed, remove the search results
                thisView.model.set("prevResult", null);

                // Force the omni-search bar to lose focus
                thisView.$el.find("input input[type=text]").blur();
            }
            return false;
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            thisView.listenTo(thisView.model, "change:nodes", thisView.render);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {
                icon: thisView.model.get("icon"),
                title: thisView.model.get("title"),
                match: thisView.model.get("match"),
                count: thisView.model.get("nodes") !== null ? thisView.model.get("nodes").length: 0
            };
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }
    });
    return View;
});
