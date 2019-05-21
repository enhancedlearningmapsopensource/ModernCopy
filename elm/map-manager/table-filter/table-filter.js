define(["backbone",
        "mustache",
        "text!./table-filter.html"], 
function(Backbone,
         Mustache,
         Template){
             
    var pvt = {};         
    var View = Backbone.View.extend({     
        template: Template,
        events: {
            "change #showdeleted": "delegateChangeShowDeleted",
            "keyup #filter-maps": "delegateFilterMaps"
        },
        
        delegateChangeShowDeleted: function(e){
            var thisView = this;
            var show = $(e.currentTarget).prop("checked");
            appstate.set("showdeletedmaps", show);
        },
        
        delegateFilterMaps: function(e){
            var thisView = this;
            var filter = $(e.currentTarget).val();
            appstate.set("maptablefilter", filter);
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Mustache.parse(thisView.template);
            
            thisView.listenTo(appstate, "change:showdeletedmaps", thisView.render);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {
                showDeleted: appstate.get("showdeletedmaps"),
                filter: appstate.get("maptablefilter")
            };
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }
    });
    return View;
});