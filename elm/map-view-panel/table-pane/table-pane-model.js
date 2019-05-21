define(["backbone",
        "../filter/filter-model",
        "../delete-switch/delete-switch-model",
        "../live-map-table/live-map-table-model",
        "../dead-map-table/dead-map-table-model",
        "../save-buttons/save-buttons-model"], 
function(Backbone,
         Filter,
         DeleteSwitch,
         LiveMapTable,
         DeadMapTable,
         SaveButtons){
    var pvt = {};         
    var Model = Backbone.Model.extend({
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisModel = this;
            thisModel.set({
                "modeltype": "table-pane",
                "filter": new Filter({id: "filter-model"}),
                "deleteswitch": new DeleteSwitch({id: "delete-switch-model"}),
                "livemaptable": new LiveMapTable({id: "live-map-table-model"}),
                "deadmaptable": new DeadMapTable({id: "dead-map-table-model"}),
                "savebuttons": new SaveButtons({id: "save-buttons-model"}),
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