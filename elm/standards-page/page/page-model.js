define(["backbone",
        "../tabs/tabs-model",
        "../table/table-collection",
        "../grid/grid-collection"], 
function(Backbone,
         TabsModel,
         TableCollection,
         GridCollection){
             
    var pvt = {};         
    var Model = Backbone.Model.extend({
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisModel = this;
            thisModel.set({
                "tabs": new TabsModel({id: "tabs-model"}),
                "tables": new TableCollection(),
                "grids": new GridCollection()
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