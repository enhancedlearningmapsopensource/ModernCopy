define(["core",
        "mustache",
        "text!./domain.html",
        "hub-lib",
        "../cell/cell"],
function(Core,
         Mustache,
         Template,
         Hub,
         Cell){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {
            "click .domain-group-name": "delegateClickDomainName"
        },
        
        delegateClickDomainName: function(e){
            e.preventDefault();
            var thisView = this;
            
            // Toggle selected
            var selected = !thisView.model.get("selected");
            
            // Make all cells match
            thisView.model.get("cells").forEach(function(d){
                d.set("selected", selected);
            });
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            // Table cares when:
            // a) cells are added
            
            thisView.listenTo(Hub.get("cell"), "add", pvt.hubCellAdded);
            thisView.listenTo(thisView.model.get("cells"), "add", pvt.cellAdded);
            thisView.listenTo(thisView.model, "change:selected", thisView.render);
            thisView.listenTo(thisView.model.get("cells"), "change:selected", pvt.cellSelectedChanged);
            
            Hub.get("cell").forEach(function(d){
                pvt.hubCellAdded.call(thisView, d);
            });
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            
            // Get the name
            var name = Hub.stripHtml(thisView.model.get("hubmodel").get("name"));
            
            // Get the short version
            var short = Hub.stripHtml(thisView.model.get("hubmodel").get("short"));
            short = (short === null || typeof short === "undefined" || short.trim().length === 0) ? name : short;
            
            var renderOb = {
                name: name,
                numcells: thisView.model.get("cells").length,
                selected: thisView.model.get("selected"),
                roword: thisView.model.get("hubmodel").get("roword"),
                ord: thisView.model.get("hubmodel").get("ord"),
                short: short
            };
            
            // Detach
            var cells = thisView.detachGroup("cell-views");
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            // Order cells
            cells.sort(function(a,b){
                return a.model.get("hubmodel").get("ord") - b.model.get("hubmodel").get("ord");
            });
            
            // Reattach
            var $cells = thisView.$el.find(".domain-group-cells");
            cells.forEach(function(d){
                $cells.append(d.$el);
            });
        }
    });
    
    /*pvt.cellAdded = function(model){ 
        var thisView = this;
    };*/
    pvt.hubCellAdded = function(model){ 
        var thisView = this;
        if(model.get("domaingroupid") === thisView.model.get("hubmodel").get("domaingroupid")){
            thisView.model.get("cells").add({
                id: model.id,
                hubmodel: model
            });
        }
    };
    pvt.cellAdded = function(model){ 
        var thisView = this;
        thisView.addToGroup("cell-views", new Cell({
            id: model.id,
            model: model
        }), model.id).render();
        thisView.render();
    };
    
    pvt.cellSelectedChanged = function(model){
        var thisView = this;
        var areAllSelected = thisView.model.get("cells").reduce(function(acc, val){
            return (acc && val.get("selected"));
        }, true);
        thisView.model.set("selected", areAllSelected);
    };
    
    
    return View;
});