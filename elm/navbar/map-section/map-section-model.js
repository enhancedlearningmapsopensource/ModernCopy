define(["backbone",
        "../map-view/map-view-collection"], 
function(Backbone,
         MapViewCollection){
    var pvt = {};         
    var Model = Backbone.Model.extend({
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisModel = this;
            thisModel.set({
                "modeltype": "map-section",
                "initial": null,
                "ordered": null,
                "mapviews": new MapViewCollection(),
                "initialviews": new MapViewCollection(),
                "orderedviews": new MapViewCollection(),
                "showall": false
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