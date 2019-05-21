define(["backbone", "hub-lib", "jsclass!3rdParty/jsclass/"], function(Backbone, Hub, JsClass){
    var view = Backbone.View.extend({
        initialize: function(){
            var thisView = this;
            thisView.model = new Backbone.Model({
                maptonode: new JsClass.Hash(),
                nodetomap: new JsClass.Hash()
            });
            
            function startListening(){
                if(!Hub.has("local") || Hub.get("mapnode") === null){
                    setTimeout(startListening, 1);
                }else{
                    thisView.listenTo(Hub.get("mapnode"), "update", thisView.update);
                    thisView.update();
                }
            }
            startListening();
            
        },
        
        update: function(model, options){
            var thisView = this;
            var mapToNode = new JsClass.Hash();
            var nodeToMap = new JsClass.Hash();
            
            
            Hub.get("mapnode").forEach(function(d){
                var nodeID = d.get("nodeid");
                var mapID = d.get("mapid");
                
                if(!mapToNode.hasKey(mapID)){
                    mapToNode.store(mapID, []);
                }
                mapToNode.fetch(mapID).push(nodeID);
                
                if(!nodeToMap.hasKey(nodeID)){
                    nodeToMap.store(nodeID, []);
                }
                nodeToMap.fetch(nodeID).push(mapID);
            });
            
            thisView.model.set("maptonode", mapToNode);
            thisView.model.set("nodetomap", nodeToMap);
        }
    });
    
    return view;
});


