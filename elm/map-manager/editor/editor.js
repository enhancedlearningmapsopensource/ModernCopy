define(["backbone",
        "mustache",
        "text!./editor.html",
        "activeGraph",
        "hub-lib",
        "../map-definition-generator",
        "jsclass!3rdParty/jsclass/"], 
function(Backbone,
         Mustache,
         Template,
         ActiveGraph,
         Hub,
         Generator,
         JsClass){
             
    var pvt = {};         
    var View = Backbone.View.extend({     
        template: Template,
        events: {
            "click .btn-default": "delegateCancel",
            "click .btn-primary": "delegateSave"
        },
        
        delegateCancel: function(e){
            e.preventDefault();
            var thisView = this;
            thisView.model.set("map", null);
        },
        
        delegateSave: function(e){
            e.preventDefault();
            var thisView = this;
            
            var mapDef = Generator.getMapDefinitionForActiveSubgraph();
            var formattedNodes = {
                "gray":[],
                "red": [],
                "blue": []
            };
            var mapViewsData = application.mapviewsdata;
                
            mapDef.mapName = thisView.$el.find("#mapname").val();
            mapDef.mapDesc = thisView.$el.find("#mapdescription").val();

            // Lock the site
            console.log("locking site");
            var lockID = lockSite(true , "my-map-views-edit-window.js::delegateEdit");

            mapDef.title = mapDef.mapName;
            mapDef.description = mapDef.mapDesc;
            
            var serverModel = thisView.model.get("map");
            var sequence = (serverModel.id === "temporary-map-model") ? Hub.get("map").create({}, {wait:true}) : Promise.resolve(serverModel);
            
            sequence.then(function(model){
                serverModel = model;
                serverModel.set({
                    title: mapDef.title,
                    description: mapDef.description
                });
                return serverModel.save({wait:true});
            }).then(function(){
                return Promise.all(Hub.get("mapnode").where({mapid: serverModel.id}).map(function(d){
                    assertDefined(d);
                    return d.destroy({wait:true});
                }));
            }).then(function(){
                assertType(serverModel.id, "number");

                // Add nodes back to the map
                mapDef.nodes.forEach(function(node){
                    assertType(node.id, "number");
                    assertType(node.color, "number");
                    Hub.get("mapnode").create({
                        nodeid: node.id,
                        color: node.color,
                        mapid: serverModel.id
                    });
                });
                
                lockSite(false , lockID);
                thisView.model.set("map", null);
                
                return ActiveGraph.loadGraph(appstate, serverModel.id, {close: true});
            });
        },
        
        edit: function(map){
            var thisView = this;
            thisView.model.set("map", map);
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Mustache.parse(thisView.template);
            thisView.model.set("map", null);
            
            thisView.listenTo(thisView.model, "change:map", thisView.render);
            thisView.listenTo(appstate, "change:activeGraph", function(){ 
                thisView.model.set("map", null); 
            });
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var map = thisView.model.get("map");
            if(map === null){
                return;
            }
            
            var renderOb = {
                editbtn: (map.id !== "temporary-map-model"),
                savebtn: (map.id === "temporary-map-model"),
                mapName: Hub.stripHtml(map.get("title")),
                mapDesc: Hub.stripHtml(map.get("description"))
            };
            
            var oldMapDef = Generator.getMapDefinitionForSavedSubgraph(map);
            var newMapDef = Generator.getMapDefinitionForActiveSubgraph();
            

            if(oldMapDef.nodes !== newMapDef.nodes){
                var oldNodes = oldMapDef.nodes.map(function(d){return d.id;});
                var newNodes = newMapDef.nodes.map(function(d){return d.id;});

                oldNodes = new JsClass.Set(oldNodes);
                newNodes = new JsClass.Set(newNodes);

                renderOb.newnodes = newNodes.difference(oldNodes).toArray().join(",");
                renderOb.oldnodes = oldNodes.difference(newNodes).toArray().join(",");
            }            
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        },
        
        save: function(){
            var thisView = this;
            var serverModel = ActiveGraph.getServerModel();
            thisView.model.set("map", serverModel);
        },
        
        saveas: function(){
            // Create a blank map
            Hub.get("map").add({
                id: "temporary-map-model",
                creatorid: userID,
                ispublic: false
            });
            this.model.set("map", Hub.get("map").get("temporary-map-model"));
        }
        
    });
	return View;
});