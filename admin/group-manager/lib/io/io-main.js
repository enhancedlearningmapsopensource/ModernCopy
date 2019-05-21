define(["backbone",
        "mustache",
        "text!./templates/io-main.html",
        "./lib/buttons",
        "./lib/export",
        "./lib/import"], 
function(Backbone,
         Mustache,
         Template,
         Buttons,
         Export,
         Import){
             
    var pvt = {};         
    var View = Backbone.View.extend({     
        template: Template,
        events: {},
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Mustache.parse(thisView.template);
            
            thisView.model = new Backbone.Model({
                id: "io-main-model",
                buttons: new Backbone.Model({
                    id: "button-model"
                }),
                exporter: new Backbone.Model({
                    id: "export-model"
                }),
                importer: new Backbone.Model({
                    id: "import-model"
                }),
                common: new Backbone.Model({
                    id: "common-model",
                    state: "none" // none|import|export
                })
            });
            
            // Preset common
            [
                "buttons",
                "importer",
                "exporter"
            ].forEach(function(v){
                thisView.model.get(v).set("common", thisView.model.get("common"));
            });
            
            // Set up buttons
            thisView.model.get("buttons").set({
                view: new Buttons({
                    id: "button-view",
                    model: thisView.model.get("buttons")
                })
            });
            
            // Set up exporter
            thisView.model.get("exporter").set({
                view: new Export({
                    id: "export-view",
                    model: thisView.model.get("exporter")
                })
            });
            
            // Set up importer
            thisView.model.get("importer").set({
                view: new Import({
                    id: "import-view",
                    model: thisView.model.get("importer")
                })
            });
            
            // Pre-render views
            [
                "buttons",
                "importer",
                "exporter"
            ].forEach(function(v){                
                thisView.model.get(v).get("view").render();
            });
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {};
            
            var views = [
                "buttons",
                "importer",
                "exporter"
            ];
            
            // Detach
            views.forEach(function(v){
                thisView.model.get(v).get("view").$el.detach();
            });
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            // Reattach
            views.forEach(function(v){
                thisView.$el.append(thisView.model.get(v).get("view").$el);
            });
        }
    });
	return View;
});


