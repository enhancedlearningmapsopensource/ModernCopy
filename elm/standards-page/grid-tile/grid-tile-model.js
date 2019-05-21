define(["backbone", "hub-lib"], 
function(Backbone, Hub){
             
    var pvt = {};         
    var Model = Backbone.Model.extend({
        countNonElmMaps: function(){
            var thisModel = this;
            return (thisModel.hasElmMap() ? 0 : 1);
        },
        
        countNonResourceMaps: function(){
            var thisModel = this;
            return (thisModel.hasResMap() ? 0 : 1);
        }, 
        
        hasElmMap: function(){
            var thisModel = this;
            var map = thisModel.get("hubmodel");
            return (thisModel.get("visible") === true && Hub.wrap(map).ownerStatus() === "elm");
        },
        
        hasResMap: function(){
            var thisModel = this;
            var map = thisModel.get("hubmodel");
            var wrap = Hub.wrap(map);
            return (thisModel.get("visible") === true && wrap.getUserResources().length > 0);
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisModel = this;
            thisModel.set({
                "modeltype": "grid-tile",
                "visible": false,           // If true then search indicates that the tile should be shown
                "filtered": false           // If true then the filters are preventing the tile from being shown.
            });
        },
        
        /**
         * Render the view
         */
        parse:function(data){
            var thisModel = this;
        }
        
    });
    return Model;
});
