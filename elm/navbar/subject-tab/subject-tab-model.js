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
                "modeltype": "subject-tab"
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