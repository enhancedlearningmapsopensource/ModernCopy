/**
 * Wrapper for set models
 */


define(["./base-wrapper", "../main"], function(BaseWrapper, Hub){
    var Wrapper = BaseWrapper.extend({
        
        /**
         * Get the ids of the domains tagged with the subject
         * @return {number[]}
         */
        subjects: function(){
            var thisModel = this;
            var subjects = Hub.get("subject").where({setid: thisModel.id});
            return subjects;
        },
        
        /**
         * Get the ids of the gardes tagged with the subject
         * @return {number[]}
         */
        subjectIDs: function(){
            var thisModel = this;
            var subjectIDs = thisModel.subjects().map(function(d){
                return Number(d.get("subjectid"));
            });
            return subjectIDs;
        },
        
        mapIDs: function(){
            var thisModel = this;
            var ids = Hub.get("setmap").where({setid:thisModel.id},false,Hub).map(function(d){
                return Number(d.get("mapid"));
            });
            return ids;
        },
        
        nodeIDs: function(){
            var thisModel = this;
            var ids = Hub.get("setnode").where({setid:thisModel.id},false,Hub).map(function(d){
                return Number(d.get("nodeid"));
            });
            return ids;
        },
        
        resourceIDs: function(){
            var thisModel = this;
            var ids = Hub.get("setresource").where({setid:thisModel.id},false,Hub).map(function(d){
                return Number(d.get("resourceid"));
            });
            return ids;
        },
        
        standardIDs: function(){
            var thisModel = this;
            var ids = Hub.get("setstandard").where({setid:thisModel.id},false,Hub).map(function(d){
                return Number(d.get("sid"));
            });
            return ids;
        }
        
    });
    return function(toWrap){ return BaseWrapper.wrap(toWrap, Wrapper); }
});


