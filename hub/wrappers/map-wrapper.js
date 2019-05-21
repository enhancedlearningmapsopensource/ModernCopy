/**
 * Wrapper for map models
 */


define(["./base-wrapper", "../main"], function(BaseWrapper, Hub){
    var Wrapper = BaseWrapper.extend({
        /**
         * Determine the map color status of each of the given maps.
         * @param {object[]} maps - maps to check
         * @return {string} - "redblue","blue","red","gray"
         */
        colorStatus: function(){
           var d = this;
           
           if(d.get("title") === "RL.2.1"){
               var k =0;
           }
           
           if(!d.hasOwnProperty("id")){
               throw Error("no id for map.");
           }else{
               var nodeColor = d.getNodeColorMap();
               var hasRed = false,
                   hasBlue = false,
                   hasGray = false;
               nodeColor.forEach(function(n){
                   if(hasRed && hasBlue && hasGray){
                       return;
                   }

                   switch(n.color){
                       case 0: hasGray = true; break;
                       case 1: hasRed = true; break;
                       case 2: hasBlue = true; break;
                       default:
                           throw Error("Unknown color: " + n.color);
                   }
               });

               if(hasRed && hasBlue){
                   return "redblue";
               }else if(hasRed){
                   return "red";
               }else if(hasBlue){
                   return "blue";
               }else if(hasGray){
                   return "gray";
               }else{
                   return "none";
               }
           }
        },
        
        
        getNodeColorMap: function(){
            var thisModel = this;
            return Hub.get("mapnode").where({mapid: thisModel.id}).map(function(d){
                return {
                    id: d.get("nodeid"),
                    color: d.get("color")
                };
            });
        },
        
        /**
         * Get resources associated with the map and visible to the current user.
         * @return {Backbone.Model[]} - resources associated with the map and visible to the current user.
         */
        getUserResources: function(){
            var thisModel = this;
            var mapID = thisModel.id;
            
            var records = Hub.get("mapresource").where({mapid: mapID});
            var resources = Hub.getModels("resource", records.map(function(r){
                return r.get("resourceid");
            }));
            return resources;
        },
        
        nodeIDs: function(){
            var thisModel = this;
            return Hub.search("mapnode", thisModel.id);
            /*return this.nodes().map(function(d){
                return d.id;
            });*/
        },
        
        nodes: function(){
            var thisModel = this;
            return Hub.getModels("node", thisModel.nodeIDs());
            /*return Hub.get("mapnode").where({mapid: thisModel.id}).map(function(d){
                return Hub.get("node").get(d.get("nodeid"));
            });*/
        },
        
        /**
         * Determine the map owner status of each of the given maps.
         * @param {object[]} maps - maps to check
         * @return {string} - "elm"|"user"|"none"
         */
        ownerStatus: function(){
           var d = this;
           if(!d.hasOwnProperty("id")){
               return "none";
           }else{
               if(d.get("ispublic") === 1){
                   return "elm";
               }else if(d.get("creatorid") === userID){
                   return "user";
               }else{
                   return "none";
               }
           }
        },
        
        /**
         * Get subjects of all nodes
         */
        subjectIDs: function(){
            var thisModel = this;
            var nodes = thisModel.nodes();
            
            var subjects = {};
            nodes.forEach(function(node){
                var subjectIDs = Hub.wrap(node).subjectIDs();
                subjectIDs.forEach(function(subjectID){
                    if(!subjects.hasOwnProperty(subjectID)){
                        subjects[subjectID] = true;
                    }
                });
            });
            return Object.keys(subjects).map(function(d){
                return Number(d);
            });
        }
    });
    return function(toWrap){ return BaseWrapper.wrap(toWrap, Wrapper); }
});


