define(["require",
        "backbone",
        "mustache",
        "text!../templates/export.html"], 
function(require,
         Backbone,
         Mustache,
         Template){
             
    var pvt = {};         
    var View = Backbone.View.extend({     
        template: Template,
        events: {
            "click .btn-back": "delegateBack"
        },
        
        delegateBack: function(e){
            var thisView = this;
            e.preventDefault();
            thisView.model.get("common").set("state", "none");
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
            
            if(thisView.model.get("common").get("state") === "export"){
                thisView.$el.show();
            }else{
                thisView.$el.hide();
                return;
            }
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            
            var path = require.toUrl("../ajax/export.php");
            $.post(path, {}, function(ret){
                thisView.$el.find("textarea").html(ret);
            });
            
        }
    });
    
    return View;
});



