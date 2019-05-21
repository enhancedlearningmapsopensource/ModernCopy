define(["core",
        "mustache",
        "text!./panel.html",
        "./panel-model",
        "../table-pane/table-pane",
        "../edit-pane/edit-pane",
        "../upload-pane/upload-pane",
        "../resource-pane/resource-pane"], 
function(Core,
         Mustache,
         Template,
         PanelModel,
         TablePane,
         EditPane,
         UploadPane,
         ResourcePane){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {},
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            thisView.model = new PanelModel({id : "panel-model"});
            
            appstate.set("mapbeingsaved", null);
            
            thisView.add("tablepane", new TablePane({
                id: "table-pane-view",
                model: thisView.model.get("tablepane")
            })).render();
            thisView.add("editpane", new EditPane({
                id: "edit-pane-view",
                model: thisView.model.get("editpane")
            })).render();
            thisView.add("uploadpane", new UploadPane({
                id: "upload-pane-view",
                model: thisView.model.get("uploadpane")
            })).render();
            thisView.add("resourcepane", new ResourcePane({
                id: "resource-pane-view",
                model: thisView.model.get("resourcepane")
            })).render();
            
            thisView.listenTo(appstate, "change:mapbeingsaved", thisView.render);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {};
            
            thisView.get("tablepane").$el.detach();
            thisView.get("editpane").$el.detach();
            thisView.get("uploadpane").$el.detach();
            thisView.get("resourcepane").$el.detach();
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            var mapBeingSaved = appstate.get("mapbeingsaved");
            if(mapBeingSaved === null){
                thisView.$el.append(thisView.get("tablepane").$el);
            }
        }
    });
    return View;
});
