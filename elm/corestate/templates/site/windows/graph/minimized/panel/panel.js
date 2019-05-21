define(["core",
        "mustache",
        "text!./panel.html",
        "activeGraph",
        "./panel-model",
        "../graph/graph"], 
function(Core,
         Mustache,
         Template,
         ActiveGraph,
         PanelModel,
         GraphView){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {},
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            // Create model if necessary
            if(typeof thisView.model === "undefined"){
                thisView.model = new PanelModel({
                    id: "minimized-panel-model"
                });
            }
            
            thisView.listenTo(appstate, "change:activeGraph", pvt.minimizedGraphsChanged);
            thisView.listenTo(appstate, "change:minimizedGraphs", pvt.minimizedGraphsChanged);
            thisView.listenTo(thisView.model.get("graphs"), "add", pvt.graphAdded);
            thisView.listenTo(appstate.get("selectedcircles"), "update", thisView.render);
            thisView.listenTo(appstate.get("selectedcircles"), "reset", thisView.render);
            thisView.listenTo(appstate, "change:sidePanel", thisView.render);
            
            pvt.minimizedGraphsChanged.call(thisView);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {
                botopen: (appstate.get("selectedcircles").length > 0),
                sideopen: (appstate.get("sidePanel") !== null)
            };
            
            var views = thisView.detachGroup("graph-views");
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            var $inner = thisView.$el.find("#minimized-panel-inner");
            views.forEach(function(d){
                if(d.model.get("avaliable") === false){
                    $inner.append(d.$el);
                }
            });
            
            thisView.$el.find('[data-toggle="tooltip"]').each(function(e){
                $(this).tooltip();
            });
        }
    });
    
    pvt.graphAdded = function(model){
        var thisView = this;
        thisView.addToGroup("graph-views", new GraphView({
            id: "graph-view- "+ model.id,
            model: model
        }, "graph-view-" + model.id)).render();
    };
    
    pvt.minimizedGraphsChanged = function(model, options){
        var thisView = this;
        
        var minimizedStates = ActiveGraph.getOtherGraphs(appstate);
        var views = thisView.children.getGroup("graph-views");
        
        views.forEach(function(d){
            d.model.set("avaliable", true);
        });
        
        while(minimizedStates.length > views.length){
            thisView.model.get("graphs").add({
                id: views.length
            });
            
            views = thisView.children.getGroup("graph-views");
            
            /*thisView.addToGroup("graph-views", new GraphView({
                id: "graph-view",
                model: new GraphModel({
                    id: "graph-model-" + views.length
                })
            }, "graph-view-" + views.length)).render();*/
        }
        
        // Assign each state to a graph
        var promises = [];
        for(var i = 0; i < minimizedStates.length; i++){
            // Get a view
            var view = views[i];
            view.model.set("avaliable", false);
            promises.push(view.link(minimizedStates[i]));
        }
        
        Promise.all(promises).then(function(){
            thisView.render();
        });
    };
    
    return View;
});
