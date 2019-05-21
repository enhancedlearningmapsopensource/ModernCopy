define(["backbone",
        "../omnisearch/omnisearch-model"], 
function(Backbone,
         OmnisearchModel){
    var pvt = {};         
    var Model = Backbone.Model.extend({
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisModel = this;
            thisModel.set({
                "modeltype": "search",
                "omnisearch": new OmnisearchModel({id: "omnisearch-model"}),
                "searchbar": null
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