/**
 * Wrapper for map models
 */


define(["./base-wrapper", "../main"], function(BaseWrapper, Hub){
    var Wrapper = BaseWrapper.extend({
        
        /**
         * Get the ids of the groups that this user is in
         * @return {number[]}
         */
        groupIDs: function(){
            var thisModel = this;
            return Hub.get("usergroup").where({userid: thisModel.id}).map(function(d){
                return d.get("groupid");
            });
        },
        
        /**
         * Determine whether the user is a part of the 'admin' group
         * @return {boolean}
         */
        isAdmin: function(){
            var thisModel = this;
            if(!thisModel.has("_isadmin")){
                // Get admin group id 
                var adminGroupID = Hub.get("group").findWhere({name: "admin"}).id;
                
                // Get group ids of user
                var groupIDs = thisModel.groupIDs();
                
                thisModel.set("_isadmin", ($.inArray(adminGroupID, groupIDs) !== -1));
            }
            return thisModel.get("_isadmin");
        },
        
        /**
         * Get the ids of the maps that this user created
         * @return {number[]}
         */
        mapIDs: function(){
            var thisModel = this;
            return Hub.get("map").where({creatorid: thisModel.id}).map(function(d){
                return d.get("mapid");
            });
        }
        
        
    });
    return function(toWrap){ return BaseWrapper.wrap(toWrap, Wrapper); }
});


