define(["core",
        "mustache",
        "text!./map-section.html",
        "../map-view/map-view"], 
function(Core,
         Mustache,
         Template,
         MapView){
             
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
            
            thisView.listenTo(thisView.model, "change:initial", pvt.initialChanged);
            thisView.listenTo(thisView.model, "change:ordered", pvt.orderedChanged);
            thisView.listenTo(thisView.model, "change:showall", thisView.render);
            thisView.listenTo(thisView.model.get("mapviews"), "add", pvt.addMapView);
            thisView.listenTo(thisView.model.get("initialviews"), "reset", thisView.render);
            thisView.listenTo(thisView.model.get("orderedviews"), "reset", thisView.render);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {
                title: thisView.model.get("title"),
                res: thisView.model.get("res"),
                path: gRoot,
                elmiconpath: config.LOGO_PATH
            };
            var initial = thisView.model.get("initialviews");
            var ordered = thisView.model.get("orderedviews");
            
            // Detach
            var mapViews = thisView.detachGroup("map-views");
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            // Reattach
            mapViews.forEach(function(view){
                if(thisView.model.get("showall") === false){
                    if(initial.has(view.model.id)){
                        thisView.$el.append(view.$el);
                    }
                }else if(thisView.model.get("showall") === true){
                    if(ordered.has(view.model.id) || initial.has(view.model.id)) {
                        thisView.$el.append(view.$el);
                    }
                }else{
                    throw Error("showall: " + thisView.model.get("showall"));
                }
            });
        }
    });
    
    pvt.addMapView = function(model){
        var thisView = this;
        thisView.addToGroup("map-views", new MapView({
            id: model.id,
            model: model
        }), model.id).render();
    };
    
    pvt.initialChanged = function(){
        var thisView = this;
        pvt.mapSetChanged.call(thisView, "initial");
    };
    
    pvt.orderedChanged = function(){
        var thisView = this;
        pvt.mapSetChanged.call(thisView, "ordered");
    };
    
    pvt.mapSetChanged = function(set){
        var thisView = this;
        var mapViews = thisView.model.get("mapviews");
        
        var viewSet = thisView.model.get(set);
        var viewlst = [];
        if(viewSet !== null){
            viewSet.forEach(function(d){
                if(!mapViews.has(d.id)){
                    mapViews.add({
                        id: d.id,
                        hubmodel: d
                    });
                }
                viewlst.push(mapViews.get(d.id));
            });
        }
        
        thisView.model.get(set + "views").reset(viewlst);
    };
    
    return View;
});
