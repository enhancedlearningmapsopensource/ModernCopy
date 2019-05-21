define(["core",
        "mustache",
        "text!./main/template.html",
        "./table-filter/table-filter",
        "./map-table/map-table",
        "./editor/editor",
        "./map-resource-table/map-resource-table",
        "./uploader/uploader",
        "./uploader/uploader-model",
        "./resource-editor/resource-editor",
        "./resource-editor/resource-editor-model",
        "side-panel/utility/map-saver/map-saver"],
        //"./save-button-set/save-button-set"], 
function(Core,
         Mustache,
         Template,
         TableFilter,
         MapTable,
         Editor,
         MapResourceTable,
         Uploader,
         UploaderModel,
         ResourceEditor,
         ResourceEditorModel,
         SaveButtonSet){
             
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
            
            thisView.model = new Backbone.Model({
                id: "map-manager-model",
                isopen: false,
                renderswap: [],
                state: "table"
            });
            
            // Add table filter
            thisView.model.set("tablefilter", new Backbone.Model({id: "table-filter-model"}));
            thisView.model.get("tablefilter").set("view", new TableFilter({
                id: "table-filter-view", 
                model: thisView.model.get("tablefilter")
            }));
            thisView.model.get("tablefilter").get("view").render();
            thisView.model.get("renderswap").push(thisView.model.get("tablefilter"));
            
            // Add map table
            thisView.model.set("maptable", new Backbone.Model({id: "map-table-model"}));
            thisView.model.get("maptable").set("view", new MapTable({
                id: "map-table-view", 
                model: thisView.model.get("maptable")
            }));
            thisView.model.get("maptable").get("view").render();
            thisView.model.get("renderswap").push(thisView.model.get("maptable"));
            
            // Add map editor
            thisView.model.set("editor", new Backbone.Model({id: "editor-model"}));
            thisView.model.get("editor").set("view", new Editor({
                id: "editor-view", 
                model: thisView.model.get("editor")
            }));
            thisView.model.get("editor").get("view").render();
            thisView.model.get("renderswap").push(thisView.model.get("editor"));
            
            // Add map resource table
            thisView.model.set("mrtable", new Backbone.Model({id: "map-resource-table-model"}));
            thisView.model.get("mrtable").set("view", new MapResourceTable({
                id: "map-resource-table-view", 
                model: thisView.model.get("mrtable")
            }));
            thisView.model.get("mrtable").get("view").render();
            thisView.model.get("renderswap").push(thisView.model.get("mrtable"));
            
            // Add uploader
            thisView.model.set("uploader", new UploaderModel({id: "uploader-model"}));
            thisView.model.get("uploader").set("view", new Uploader({
                id: "file-selector-view", 
                model: thisView.model.get("uploader")
            }));
            thisView.model.get("uploader").get("view").render();
            thisView.model.get("renderswap").push(thisView.model.get("uploader"));
            
            // Add resource editor
            thisView.model.set("resource-editor", new ResourceEditorModel({id: "resource-editor-model"}));
            thisView.model.get("resource-editor").set("view", new ResourceEditor({
                id: "resource-editor-view", 
                model: thisView.model.get("resource-editor")
            }));
            thisView.model.get("resource-editor").get("view").render();
            thisView.model.get("renderswap").push(thisView.model.get("resource-editor"));
            
            // Add save button set
            thisView.model.set("savebuttonset", new Backbone.Model({id: "save-button-set-model"}));
            thisView.model.get("savebuttonset").set("view", new SaveButtonSet({
                id: "save-button-set-view", 
                model: thisView.model.get("savebuttonset")
            }));
            thisView.model.get("savebuttonset").get("view").render();
            thisView.model.get("renderswap").push(thisView.model.get("savebuttonset"));
            
            
            
            thisView.listenTo(appstate, "change:sidePanel", pvt.changeActivePanel);
            thisView.listenTo(thisView.model, "change:isopen", pvt.openClosePanel);
            thisView.listenTo(thisView.model, "change:state", thisView.render);
            thisView.listenTo(thisView.model.get("maptable"), "change:editmap", pvt.editMap);
            thisView.listenTo(thisView.model.get("maptable"), "change:uploadmap", pvt.uploadMap);
            thisView.listenTo(thisView.model.get("editor"), "change:map", pvt.changeEditorMap);
            thisView.listenTo(thisView.model.get("mrtable"), "change:map", pvt.changeEditorMap);
            thisView.listenTo(thisView.model.get("mrtable"), "change:filemap", pvt.addFile);
            thisView.listenTo(thisView.model.get("mrtable"), "change:resourcetoedit", pvt.editResource);
            thisView.listenTo(thisView.model.get("uploader"), "change:map", pvt.changeFileSelectorMap);
            thisView.listenTo(thisView.model.get("savebuttonset"), "change:save", pvt.save);
            thisView.listenTo(thisView.model.get("savebuttonset"), "change:saveas", pvt.saveas);
            thisView.listenTo(thisView.model.get("resource-editor"), "change:resource", pvt.resourceEditorChange);
            
            thisView.render();
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {};
            
            // Detach
            thisView.model.get("renderswap").forEach(function(model){
                model.get("view").$el.detach();
            });
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            if(thisView.model.set("isopen")){
                thisView.$el.addClass("open");
            }
            
            // Reattach
            var $main = thisView.$el.find("#mapmanagermain");
            switch(thisView.model.get("state")){
                case "table":
                    $main.append(thisView.model.get("tablefilter").get("view").$el);
                    $main.append(thisView.model.get("maptable").get("view").$el);
                    $main.append(thisView.model.get("savebuttonset").get("view").$el);
                    break;
                case "edit":
                    $main.append(thisView.model.get("editor").get("view").$el);
                    break;
                case "editresource":
                    $main.append(thisView.model.get("resource-editor").get("view").$el);
                    break;
                case "upload":
                    $main.append(thisView.model.get("mrtable").get("view").$el);
                    break;
                case "file":
                    $main.append(thisView.model.get("uploader").get("view").$el);
                    break;
            }
        }
    });
    
    pvt.changeActivePanel = function(){
        var thisView = this;
        thisView.model.set("state", "table");
        
        var sidePanel = appstate.get("sidePanel");
        if (sidePanel === "My Map Views") {
            thisView.model.set("isopen", true);
        }else{
            thisView.model.set("isopen", false);
        }
    };
    
    pvt.changeEditorMap = function(model, value){
        var thisView = this;
        if(value === null){
            thisView.model.set("state", "table");
        }
    };
    
    pvt.editMap = function(model, value){
        if(value !== null){
            var thisView = this;
            thisView.model.get("editor").get("view").edit(value);
            thisView.model.set("state", "edit");
        }
    };
    
    pvt.editResource = function(model, value){
        if(value !== null){
            var thisView = this;
            thisView.model.get("resource-editor").set("resource",value);
            thisView.model.set("state", "editresource");
        }
    },
    
    pvt.openClosePanel = function(){
        var thisView = this;
        if(thisView.model.get("isopen") === true){
            thisView.$el.addClass("open");
        }else{
            thisView.$el.removeClass("open");
        }
    };
    
    pvt.uploadMap = function(model, value){
        if(value !== null){
            var thisView = this;
            thisView.model.get("mrtable").set("map", value);
            thisView.model.set("state", "upload");
        }
    };
    
    pvt.addFile = function(model, value){
        if(value !== null){
            var thisView = this;
            thisView.model.get("uploader").set("map", value);
            thisView.model.set("state", "file");
        }
    };
    
    pvt.changeFileSelectorMap = function(model, value){
        if(value === null){
            var thisView = this;
            thisView.model.set("state", "upload");
        }
    };
    
    pvt.resourceEditorChange = function(model, value){
        if(value === null){
            var thisView = this;
            thisView.model.set("state", "upload");
        }
    },
    
    pvt.save = function(model, value){
        if(value === true){
            var thisView = this;
            thisView.model.get("editor").get("view").save();
            thisView.model.set("state", "edit");
        }
    };
    
    pvt.saveas = function(model, value){
        if(value === true){
            var thisView = this;
            thisView.model.get("editor").get("view").saveas();
            thisView.model.set("state", "edit");
        }
    };
    
    return View;
});