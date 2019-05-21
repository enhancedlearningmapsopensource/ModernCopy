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
                "modeltype": "navbar-dropdown-button",
                "open": false
            });
            
            if(!thisModel.has("items")){
                thisModel.set("items", []);
            }
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