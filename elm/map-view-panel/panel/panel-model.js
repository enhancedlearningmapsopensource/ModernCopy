define(["backbone",
        "../table-pane/table-pane-model",
        "../edit-pane/edit-pane-model",
        "../upload-pane/upload-pane-model",
        "../resource-pane/resource-pane-model"], 
function(Backbone,
         TablePane,
         EditPane,
         UploadPane,
         ResourcePane){
    var pvt = {};         
    var Model = Backbone.Model.extend({
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisModel = this;
            thisModel.set({
                "modeltype": "panel",
                "tablepane": new TablePane({id: "table-pane-model"}),
                "editpane": new TablePane({id: "edit-pane-model"}),
                "uploadpane": new TablePane({id: "upload-pane-model"}),
                "resourcepane": new TablePane({id: "resource-pane-model"}),
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