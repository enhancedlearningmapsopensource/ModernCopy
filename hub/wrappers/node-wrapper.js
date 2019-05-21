/**
 * Wrapper for map models
 */


define(["./base-wrapper", "../main"], function(BaseWrapper, Hub){
    var Wrapper = BaseWrapper.extend({
        
        /**
         * Alias for getChildrenIDs()
         */
        childrenIDs: function(){
            var thisModel = this;
            return thisModel.getChildrenIDs();
        },
        
        /**
         * Get the ids of parents of the node.
         * @return {Backbone.Model[]} - ids of parents of the node.
         */
        getParentIDs: function(){
            var thisModel = this;
            var nodeID = thisModel.id;
            
            var parents = Hub.get("edge").where({endnode: nodeID});
            return parents.map(function(p){
                return p.get("startnode");
            });
        },
        
        /**
         * Get the ids of children of the node.
         * @return {Backbone.Model[]} - ids of parents of the node.
         */
        getChildrenIDs: function(){
            var thisModel = this;
            var nodeID = thisModel.id;
            
            var children = Hub.get("edge").where({startnode: nodeID});
            return children.map(function(p){
                return p.get("endnode");
            });
        },
        
        /**
         * Get maps containing the node.
         * @return {Backbone.Model[]} - maps containing the node.
         */
        getMaps: function(){
            var thisModel = this;
            var nodeID = thisModel.id;
            return Hub.getModels("map", thisModel.getMapIDs());
        },
        
        /**
         * Get the ids of maps containing the node.
         * @return {number} - ids of maps containing the node.
         */
        getMapIDs: function(){
            var thisModel = this;
            var nodeID = thisModel.id;
            
            var maps = Hub.get("mapnode").where({nodeid: nodeID});
            return maps.map(function(p){
                return p.get("mapid");
            });
        },
        
        /**
         * Get the ids of standards that tag the node.
         * @return {number} - ids of standards that tag the node.
         */
        getSIDs: function(){
            var thisModel = this;
            var nodeID = thisModel.id;
            return Hub.search("nodestandard", nodeID);
            
            /*var maps = Hub.get("nodestandard").where({nodeid: nodeID});
            return maps.map(function(p){
                return p.get("sid");
            });*/
        },
        
        /**
         * Get the standards that tag the node.
         * @return {Backbone.Model[]} - standards that tag the node.
         */
        getStandards: function(){
            var thisModel = this;
            return Hub.getModels("simplestandard", thisModel.getSIDs());
        },
        
        /**
         * Alias for getMapIDs()
         */
        mapIDs: function(){
            return this.getMapIDs();
        },
        
        /**
         * Alias for getMaps()
         */
        maps: function(){
            return this.getMaps();
        },
        
        /**
         * Alias for getParentIDs()
         */
        parentIDs: function(){
            var thisModel = this;
            return thisModel.getParentIDs();
        },
        
        /**
         * Get all parent nodes of the node
         */
        parents: function(){
            var thisModel = this;
            var nodeID = thisModel.id;
            
            var parents = Hub.get("edge").where({endnode: nodeID});
            return parents;
        },
        
        /**
         * Get subjects of all standards
         */
        subjectIDs: function(){
            var thisModel = this;
            var standards = thisModel.getStandards();
            
            var subjects = {};
            standards.forEach(function(standard){
                var subjectID = Hub.wrap(standard).subjectID();
                if(!subjects.hasOwnProperty(subjectID)){
                    subjects[subjectID] = true;
                }
            });
            return Object.keys(subjects).map(function(d){
                return Number(d);
            });
        },
        
        /**
         * Get the title of the node, cleaned of <i> tags and showing the id if required
         * @param {bool = true} cleanTags - whether to remove <i> tags
         * @param {bool = null} showNodeID - whether to show the node id 
         * @return {String} - the cleaned title
         */
        title: function(cleanTags, showNodeID){
            var thisModel = this;
            var title = thisModel.get("title");
            cleanTags = (typeof cleanTags === 'undefined') ? true : cleanTags;
            
            // Get the shownodeid preference
            if(typeof showNodeID === 'undefined' || showNodeID === null){
                var pref = getPreference("NODEID_ON");
                if(pref === null){
                    throw Error("Cannot find preference: NODEID_ON");
                }
                showNodeID = (pref.localeCompare("t") === 0);
            }
            
            // Clean title
            if(cleanTags){
                title = title.replaceAll("[i]","<em>").replaceAll("[/i]","</em>");
            }     
            return ((showNodeID) ? thisModel.get("textid") + " " : "") + title;
        }
    });
    return function(toWrap){ return BaseWrapper.wrap(toWrap, Wrapper); };
});


