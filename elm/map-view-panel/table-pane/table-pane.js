define(["core",
        "mustache",
        "text!./table-pane.html",
        "../filter/filter",
        "../delete-switch/delete-switch",
        "../live-map-table/live-map-table",
        "../dead-map-table/dead-map-table",
        "../save-buttons/save-buttons"], 
function(Core,
         Mustache,
         Template,
         Filter,
         DeleteSwitch,
         LiveMapTable,
         DeadMapTable,
         SaveButtons){
             
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
            
            function create(f, name){
                thisView.add(name, new f({
                    id: name + "-view",
                    model: thisView.model.get(name)
                })).render();
            }
            
            create(Filter, "filter");
            create(DeleteSwitch, "deleteswitch");
            create(LiveMapTable, "livemaptable");
            create(DeadMapTable, "deadmaptable");
            create(SaveButtons, "savebuttons");
            
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {};
            
            thisView.get("filter").$el.detach();
            thisView.get("deleteswitch").$el.detach();
            thisView.get("livemaptable").$el.detach();
            thisView.get("deadmaptable").$el.detach();
            thisView.get("savebuttons").$el.detach();
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            var $tableControl = thisView.$el.find(".table-control");
            
            $tableControl.append(thisView.get("filter").$el);
            $tableControl.append(thisView.get("deleteswitch").$el);
            thisView.$el.append(thisView.get("livemaptable").$el);
            thisView.$el.append(thisView.get("deadmaptable").$el);
            thisView.$el.append(thisView.get("savebuttons").$el);
        }
    });
    return View;
});
