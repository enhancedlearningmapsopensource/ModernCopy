define(["core",
        "backbone",
        "mustache",
        "text!./page.html",
        "../tabs/tabs",
        "../table/table",
        "../grid/grid",
        "hub-lib",
        "text!../../corestate/templates/site/windows/graph/side-bar/side-bar.html",
        "../../corestate/templates/site/windows/graph/side-bar/side-bar"], 
function(Core,
         Backbone,
         Mustache,
         Template,
         Tabs,
         Table,
         Grid,
         Hub,
         SideBarTemplate,
         SideBar){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        sidebarTemplate: SideBarTemplate,
        events: {},
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            // Set up child views
            thisView.add("tabs-view", new Tabs({
                id: "tabs-view",
                model: thisView.model.get("tabs")
            })).render();
            
            thisView.add("side-bar", new SideBar({
                id: "sidebar-view",
                model: new Backbone.Model()
            })).render();
            
            // Page cares about:
            // a) subjects added
            
            thisView.listenTo(Hub.get("subject"), "update", pvt.tryLoad);
            thisView.listenTo(Hub.get("domaingroup"), "update", pvt.tryLoad);
            thisView.listenTo(Hub.get("cell"), "update", pvt.tryLoad);
            thisView.listenTo(Hub.get("standardcolumn"), "update", pvt.tryLoad);
            
            thisView.listenTo(Hub.get("subject"), "reset", pvt.tryLoad);
            thisView.listenTo(thisView.model.get("tables"), "add", pvt.tableAdded);
            thisView.listenTo(thisView.model.get("grids"), "add", pvt.gridAdded);
            thisView.listenTo(appstate, "change:activeSubject", thisView.render);
            
            
            // Add any subjects that already exist
            Hub.get("subject").forEach(function(subject){
                pvt.tryLoad.call(thisView, subject);
            });
            
            /*
            thisView.add("grid-view", new Grid({
                id: "grid-view",
                model: new GridModel()
            })).render();*/
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {};
            var activeSubject = appstate.get("activeSubject");
            
            // Detach
            var tables = thisView.detachGroup("table-views");
            var grids = thisView.detachGroup("grid-views");
            //thisView.get("grid-view").$el.detach();
            //thisView.get("table-view").$el.detach();
            thisView.get("tabs-view").$el.detach();
            thisView.get("side-bar").$el.detach();
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            // Reattach
            thisView.$el.append(thisView.get("side-bar").$el);
            thisView.$el.append(thisView.get("tabs-view").$el);
            tables.forEach(function(table){
                var subject = table.model.get("subject").get("name").toLowerCase();
                if(subject === activeSubject){
                    thisView.$el.append(table.$el);
                }
            });
            grids.forEach(function(grid){
                var subject = grid.model.get("subject").get("name").toLowerCase();
                if(subject === activeSubject){
                    thisView.$el.append(grid.$el);
                }
            });
            //thisView.$el.append(thisView.get("grid-view").$el);
        }
    });
    
    pvt.subjectAdded = function(model){
        var thisView = this;
        
        thisView.model.get("tables").add({
            id: model.id,
            subject: model
        });
        thisView.model.get("grids").add({
            id: model.id,
            subject: model
        });
    };
    
    pvt.tableAdded = function(model){
        var thisView = this;
        thisView.addToGroup("table-views", new Table({
            id: "table-view",
            model: model
        }), model.id).render();
        thisView.render();
    };
    
    pvt.gridAdded = function(model){
        var thisView = this;
        thisView.addToGroup("grid-views", new Grid({
            id: "grid-view",
            model: model
        }), model.id).render();
        thisView.render();
    };
    
    /**
     * Try to load the page. If all required hub tables have not yet loaded then exit the function.
     */
    pvt.tryLoad = function(){
        var thisView = this;

        // Wait until all required tables have loaded before loading the tables
        var requiredTables = ["subject", "domaingroup", "standardcolumn", "cell"];
        
        var allLoaded = requiredTables.reduce(function(acc, val){
            return (acc && Hub.get(val).length > 0);
        }, true);
        
        if(allLoaded === true){
            // Add any subjects that already exist.
            if(Hub.get("subject").length > 0){
                Hub.get("subject").forEach(function(d){
                    pvt.subjectAdded.call(thisView, d);
                });
            }
        }
    };
    
    return View;
});