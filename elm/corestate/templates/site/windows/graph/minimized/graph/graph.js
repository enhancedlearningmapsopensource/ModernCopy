define(["core",
        "mustache",
        "text!./graph.html",
        "hub-lib",
        "corestate/js/svg-interface/svg-interface"], 
function(Core,
         Mustache,
         Template,
         Hub,
         RenderSvg){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {
            "click .minimized-icon.replace": "delegateReplace",
            "click .minimized-icon.swap": "delegateSwap",
            "click .minimized-icon.remove": "delegateRemove"
        },
        
        /**
         * Replace the active graph with the minimized graph
         * @param {Event} e
         */
        delegateReplace: function(e){
           var thisView = this;
           var $el = $(e.currentTarget);
           var $span = $el.find("span");
           var $svg = $el.parents(".minimized-graph-inner:first").find("svg:first");
           var svgID = $svg.attr("id");

           var classList = $svg.find("g:first").attr('class').split(/\s+/);
           var classMatch = classList.find(function (d) {
               return (d.substr(0, 4) == "map-");
           });

           assertDefined(classMatch);
           svgID = classMatch;

           var graphManager = application.graphstate;
           assert(graphManager.isEmpty() || graphManager.handle() != svgID);

           // Destroy the top graph
           if (!graphManager.isEmpty()) {
               graphManager.destroy();
               assert(graphManager.isEmpty());
           }

           // Move the graph to the top of the stack
           if (!graphManager.push(svgID)) {
               throw Error("try using the mapped object: thisView.$el.find(\"svg\").parent()[0]");
           }
           graphManager.apply();
        },

        /**
         * Swap the active graph with the minimized graph without removing the active graph
         */
        delegateSwap: function(e){
           var thisView = this;
           var $el = $(e.currentTarget);
           var $span = $el.find("span");
           var $svg = $el.parents(".minimized-graph-inner:first").find("svg:first");
           var svgID = $svg.attr("id");

           //application.contextmenu.delegateCloseContext();
           //appstate.set("omniSearchOpen", false);

           var classList = $svg.find("g:first").attr('class').split(/\s+/);
           var classMatch = classList.find(function (d) {
               return (d.substr(0, 4) == "map-");
           });

           assertDefined(classMatch);
           svgID = classMatch;

           var graphManager = application.graphstate;
           assert(graphManager.isEmpty() || graphManager.handle() != svgID);

           // Pop the top graph off the stack (to prevent destruction)
           if (!graphManager.isEmpty()) {
               graphManager.pop();
               assert(graphManager.isEmpty());
           }

           // Move the graph to the top of the stack
           if (!graphManager.push(svgID)) {
               throw Error("try using the mapped object: thisView.$el.find(\"svg\").parent()[0]");
           }
           graphManager.apply();
        },

        /**
         * Remove the minimized graph
         */
        delegateRemove: function(e){
           var thisView = this;
           var $el = $(e.currentTarget);
           var $span = $el.find("span");
           var $svg = $el.parents(".minimized-graph-inner:first").find("svg:first");
           var svgID = $svg.attr("id");

           var classList = $svg.find("g:first").attr('class').split(/\s+/);
           var classMatch = classList.find(function (d) {
               return (d.substr(0, 4) == "map-");
           });

           assertDefined(classMatch);
           svgID = classMatch;

           var graphManager = application.graphstate;
           graphManager.push(svgID);
           graphManager.destroy();
           graphManager.apply();
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            thisView.$graph = $("<svg>");
            
            function nodeClicked(id, node, e) {
                // Ignore
            }

            function iconClicked(id, node) {
                // Ignore
            }

            function graphClicked(id, graph) {
                // Ignore
            }

            var graphOptions = {
                notext: true,
                overrides: {},
                handlers:[
                    { type: "node",  evt: "click", response: nodeClicked  },
                    { type: "icon",  evt: "click", response: iconClicked  },
                    { type: "graph", evt: "click", response: graphClicked }
                ]
            };
            
            thisView.svg = application.svglib.allocate(thisView.$graph, graphOptions);
            application.svgs[thisView.id] = thisView.svg;
            
            thisView.listenTo(thisView.model, "change:title", thisView.render);
            thisView.listenTo(thisView.model, "change:dirty", thisView.render);
        },
        
        link: function(graphStateID, options){
            var thisView = this;
            assertDefined(graphStateID);
            
            var graphManager = application.graphstate;
            
            // Load the graph, get the definition and release
            assert(graphManager.push(graphStateID));
            var graphDef = graphManager.get();
            var isDirty = graphManager.isDirty();
            assert(graphManager.pop());
            thisView.model.set("dirty", isDirty);
            
            // Get graph id from def
            var graphID = graphDef.graphID;
            if($.isNumeric(graphID)){
                var serverModel = Hub.get("map").get(graphID);
                if (serverModel && serverModel.id === graphID) {
                    var graphTitle = serverModel.get("title");
                    thisView.model.set("title", graphTitle);
                    //pvt.setTitle.call(thisView, graphTitle, !isDirty);
                }else{
                    thisView.model.set("title", graphDef.graphID);
                }
            }else{
                thisView.model.set("title", graphDef.graphID);
                //pvt.setTitle.call(thisView, graphDef.graphID, false);
            }
           
            return pvt.renderSvgModule.call(thisView, graphStateID, options);
                /*
                 * @param {object} options
                 * @param {SubgraphModel=}   options.model      - the server model 
                 * @param {GraphState=}      options.state      - the graph state
                 * @param {boolean=}         options.force      - whether to force the graph to render
                 * @param {boolean=}         options.transform  - current graph transform
                 * @param {boolean=false}    options.shownodeid - whether to show the node id 
                 * @param {bool=false}       options.showindirect - show dashed lines
                 * @param {bool=false}       options.showgrid   - show grid
                 * @param {NodeCollection}   options.nodecol    - the collection of node data
                 * @param {number}           options.selectedcircle - the id of the selected circle
                 * @param {number}           options.targetcircle - the id of the targetted circle
                 * @param {number}           options.selectededge - the id of the selected edge
                 * @returns {Promise<boolean>} - true if successful render, otherwise false
                 */
                //options.
            
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {
                title: Hub.stripHtml(thisView.model.get("title")),
                dirty: (thisView.model.get("dirty") === true)
            };
            
            thisView.$graph.detach();
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            thisView.$el.find("svg").replaceWith(thisView.$graph);
        }
    });
    
    pvt.renderSvgModule = function (graphStateID, options) {
        var thisView = this;
        var graphManager = application.graphstate;

        // Load the graph, get the definition and release
        assert(graphManager.push(graphStateID));
        var graphDef = graphManager.get();
        assert(graphManager.pop());

        // Get the subject
        //var activeSubject = appstate.get("activeSubject");

        // Get the graphID
        var graphID = graphDef.graphID;
        if (typeof graphID === 'undefined' || graphID === null) {
            return Promise.resolve(null);
        }
        assert((typeof graphID === 'string' || typeof graphID === 'number'), "invalid graph id: " + graphID);

        return RenderSvg(graphStateID, appstate, thisView.id, {showselectedcircle: false, showselectededge: false});
    };
    
    return View;
});
