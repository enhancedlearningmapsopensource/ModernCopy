define(["backbone",
        "mustache",
        "activeGraph",
        "jsclass!3rdParty/jsclass/",
        "text!./save-button-set.html",
        "../map-definition-generator"], 
function(Backbone,
         Mustache,
         ActiveGraph,
         JsClass,
         Template,
         MapDefinitionGenerator){
             
    var pvt = {};         
    var View = Backbone.View.extend({     
        template: Template,
        events: {
            "click .btn-save-map": "delegateSave",
            "click .btn-save-as-map": "delegateSaveAs"
        },
        
        delegateSave: function(e){
            e.preventDefault();
            var thisView = this;
            thisView.model.set("save", true);
            thisView.model.set("save", false);
        },
        
        delegateSaveAs: function(e){
            e.preventDefault();
            var thisView = this;
            thisView.model.set("saveas", true);
            thisView.model.set("saveas", false);
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Mustache.parse(thisView.template);
            
            thisView.model.set("save", false);
            thisView.model.set("saveas", false);
            thisView.model.set("isdirty", null);
            thisView.model.set("isowner", null);
            
            thisView.listenTo(appstate, "change:activeGraph", pvt.changeActiveGraph);
            thisView.listenTo(thisView.model, "change:isdirty", thisView.render);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {
                isdirty: thisView.model.get("isdirty"),
                isowner: thisView.model.get("isowner")
            };
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }
    });
    
    pvt.changeActiveGraph = function(model, options){
        var thisView = this;
        pvt.isDirty.call(thisView).then(function(dirty){
            thisView.model.set("isdirty", dirty);
        });
        
        if (!application.graphstate.isEmpty()) {
            // Indicate whether the graph is dirty
            var serverModel = ActiveGraph.getGraphServerModel();
            if(serverModel === null){
                thisView.model.set("isowner", false);
            }else{
                thisView.model.set("isowner", (serverModel.get("creatorid") === userID));
            }
        }
    };
    
    pvt.isDirty = function () {
        var thisView = this;
        if (!application.graphstate.isEmpty()) {
            // Indicate whether the graph is dirty
            var serverModel = ActiveGraph.getGraphServerModel();
            //return ActiveGraph.getGraphServerModel(appstate).then(function (serverModel) {
            if (typeof serverModel === 'undefined' || serverModel === null) {
                return Promise.resolve(null);
                //throw Error("could not find server model for subgraphL " + activeGraphID + ", subject: " + activeSubject);
            }

            // Assume that the current map is the focus.
            return Promise.all([
                MapDefinitionGenerator.getMapDefinitionForSavedSubgraph(serverModel),
                MapDefinitionGenerator.getMapDefinitionForActiveSubgraph()
            ]).then(function (results){
                var oldMapDef = results[0];
                var newMapDef = results[1];

                // Compare old and new
                if (oldMapDef.nodes != newMapDef.nodes) {
                    var oldNodes = oldMapDef.nodes.map(function (d) {
                        return d.id + "-" + d.color;
                    });
                    var newNodes = newMapDef.nodes.map(function (d) {
                        return d.id + "-" + d.color;
                    });

                    oldNodes = new JsClass.Set(oldNodes);
                    newNodes = new JsClass.Set(newNodes);

                    newMapDef.newnodes = newNodes.difference(oldNodes).toArray().join(",");
                    newMapDef.oldnodes = oldNodes.difference(newNodes).toArray().join(",");
                }

                if (!newMapDef.mapName) {
                    newMapDef.mapName = oldMapDef.mapName;
                }

                if (!newMapDef.mapDesc) {
                    newMapDef.mapDesc = oldMapDef.mapDesc;
                }

                var dirty = (newMapDef.newnodes.length > 0 || newMapDef.oldnodes.length > 0);
                return Promise.resolve(dirty);
            });
        } else {
            return Promise.resolve(false);
        }
    };
    
    return View;
});