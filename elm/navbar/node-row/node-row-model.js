define(["backbone"], 
function(Backbone){
    var pvt = {};         
    var Model = Backbone.Model.extend({
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisModel = this;
            thisModel.set({
                "modeltype": "node-row",
                "nodes": null
            });
            
            thisModel.set("operation", thisModel.has("operation") ? thisModel.get("operation") : null);
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