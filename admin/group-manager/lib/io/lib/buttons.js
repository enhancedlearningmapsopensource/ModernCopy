define(["backbone",
        "mustache",
        "text!../templates/buttons.html"], 
function(Backbone,
         Mustache,
         Template){
             
    var pvt = {};         
    var View = Backbone.View.extend({     
        template: Template,
        events: {
            "click .btn-import-group-data": "delegateImport",
            "click .btn-export-group-data": "delegateExport"
        },
        
        delegateExport: function(e){
            var thisView = this;
            e.preventDefault();
            thisView.model.get("common").set("state", "export");
        },
        
        delegateImport: function(e){
            var thisView = this;
            e.preventDefault();
            thisView.model.get("common").set("state", "import");
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Mustache.parse(thisView.template);
            
            thisView.listenTo(thisView.model.get("common"), "change:state", thisView.render);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {};
            
            if(thisView.model.get("common").get("state") === "none"){
                thisView.$el.show();
            }else{
                thisView.$el.hide();
                return;
            }
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }
    });
	return View;
});



