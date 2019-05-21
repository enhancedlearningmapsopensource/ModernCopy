define(["core",
        "mustache",
        "text!./omnisearch.html",   
        "hub-lib",
        "../subject-tab/subject-tab",
        "jsclass!3rdParty/jsclass/",
        "../map-section/map-section",
        "../node-row/node-row"], 
function(Core,
         Mustache,
         Template,
         Hub,
         SubjectTab,
         JsClass,
         MapSectionView,
         NodeRowView){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {
            "mousedown #show-more-row": "delegateCaptureMouseDown",
            "click #show-more-row" : "delegateShowAll"
        },
        
        delegateCaptureMouseDown: function(e){
            return false;
        },
        
        delegateShowAll: function(){
            var thisView = this;
            thisView.model.set("showall", true);
            return false;
        },
        
        enter: function(){
            var thisView = this;
            
            // In order
            var nodeRows = ["includeand", "keywordand", , "includeor", "keywordor"].map(function(d){
                var view = thisView.get("node-row-views", d);
                assertDefined(view);
                return view;
            });
                    
            var nodeRow = nodeRows.filter(function(view){
                assertDefined(view);
                return (view.model.get("nodes") !== null && view.model.get("nodes").length > 0);
            });
            
            if(nodeRow.length > 0){
                nodeRow[0].delegateClick();
            }
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            // Create map sections
            thisView.add("resource-section-view", new MapSectionView({
                id: "resource-section-view",
                model: thisView.model.get("resourcesection")
            })).render();
            thisView.add("non-resource-section-view", new MapSectionView({
                id: "non-resource-section-view",
                model: thisView.model.get("nonresourcesection")
            })).render();
            
            // Create node rows in order
            ["includeand", "keywordand", "includeor", "keywordor"].forEach(function(d){
                var nodeRow = new NodeRowView({
                    id: d,
                    model: thisView.model.get(d)
                });
                thisView.addToGroup("node-row-views", nodeRow, d).render();
                thisView.listenTo(nodeRow.model, "change:nodes", thisView.render);
            });
            
            thisView.listenTo(appstate, "change:activeGraph", pvt.delegateChangeActiveGraph);
            thisView.listenTo(appstate, "change:activeSubject", thisView.render);
            thisView.listenTo(thisView.model, "change:result", pvt.resultsChanged);
            thisView.listenTo(thisView.model, "change:open", pvt.openChanged);
            thisView.listenTo(thisView.model.get("subjects"), "add", pvt.subjectAdded);
            thisView.listenTo(thisView.model.get("subjects"), "remove", function(){throw Error();});
            thisView.listenTo(thisView.model.get("subjects"), "update", thisView.render);
            thisView.listenTo(thisView.model, "change:showall", pvt.showAllChanged);
            thisView.listenTo(Hub.get("subject"), "add", pvt.hubSubjectAdded);
            thisView.listenTo(Hub.get("subject"), "remove", function(){throw Error();});
            
            // List to map section changes
            thisView.listenTo(thisView.model.get("resourcesection").get("initialviews"), "reset", thisView.render);
            thisView.listenTo(thisView.model.get("nonresourcesection").get("initialviews"), "reset", thisView.render);
            thisView.listenTo(thisView.model.get("resourcesection").get("orderedviews"), "reset", thisView.render);
            thisView.listenTo(thisView.model.get("nonresourcesection").get("orderedviews"), "reset", thisView.render);
            
            // Add any existing subjects.
            Hub.get("subject").forEach(function(d){
                pvt.hubSubjectAdded(d);
            });
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {
                path: gRoot
            };
            var showall = thisView.model.get("showall");
            
            var result = thisView.model.get("result");
            var subjects = Hub.get("subject").forEach(function(d){
                return d.get("name");
            });
            
            //var mapViewType = (showall === true) ? "orderedviews" : "initialviews";
            
            // Check whether we have any map views to show
            var hasResourceViews = (thisView.model.get("resourcesection").get("initialviews").length > 0);
            var hasNonResourceViews = (thisView.model.get("nonresourcesection").get("initialviews").length > 0);
            renderOb.hasresults = (hasResourceViews === true || hasNonResourceViews === true);
            renderOb.hasmaps = (hasResourceViews === true || hasNonResourceViews === true);
            
            // Check for extra (initially hidden) maps
            renderOb.numextra =  0;
            if(showall === false){
                var numInit = thisView.model.get("resourcesection").get("initialviews").length + 
                        thisView.model.get("nonresourcesection").get("initialviews").length;
                
                renderOb.numextra = thisView.model.get("resourcesection").get("orderedviews").length + 
                        thisView.model.get("nonresourcesection").get("orderedviews").length - numInit;
                
            }
            renderOb.hasextra = (renderOb.numextra > 0);
            
            
            // Detach
            var subjectTabs = thisView.detachGroup("subject-views");
            var nodeRows = thisView.detachGroup("node-row-views");
            thisView.get("resource-section-view").$el.detach();
            thisView.get("non-resource-section-view").$el.detach();

            nodeRows.forEach(function(d){
                if(d.model.get("nodes") !== null && d.model.get("nodes").length > 0){
                    renderOb.hasresults = true;
                }
            });
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            var $nodeRowArea = thisView.$el.find(".node-area");
            nodeRows.forEach(function(d){
                if(d.model.get("nodes") !== null && d.model.get("nodes").length > 0){
                    $nodeRowArea.append(d.$el);
                }
            });
            
            var $mapSectionArea = thisView.$el.find(".map-section-area");
            $mapSectionArea.append(thisView.get("resource-section-view").$el);
            $mapSectionArea.append(thisView.get("non-resource-section-view").$el);
            
            var $subjectArea = thisView.$el.find(".subject-row");
            subjectTabs.forEach(function(d){
                $subjectArea.append(d.$el);
            });
        }
    });
    
    
    pvt.hubSubjectAdded = function(model, options){
        var thisView = this;
        thisView.model.get("subjects").add({
            id: model.id,
            hubmodel: model
        });
    };
    
    pvt.openChanged = function(model, options){
        var thisView = this;
        thisView.model.set("showall", false);
    };
    
    pvt.subjectAdded = function(model, options){
        var thisView = this;
        thisView.addToGroup("subject-views", new SubjectTab({
            id: model.id,
            model: model
        }), model.id).render();
    };
    
    
    pvt.showAllChanged = function(){
        var thisView = this;
        thisView.model.get("resourcesection").set({
            "showall": thisView.model.get("showall")
        });
        thisView.model.get("nonresourcesection").set({
            "showall": thisView.model.get("showall")
        });
        thisView.render();
    };
    
    pvt.resultsChanged = function(model, options){
        var thisView = this;
        var result = thisView.model.get("result");
        if(result === null){
            thisView.model.get("keywordor").set("nodes", null);
            thisView.model.get("keywordand").set("nodes", null);
            thisView.model.get("includeor").set("nodes", null);
            thisView.model.get("includeand").set("nodes", null);
            
            thisView.model.get("resourcesection").set({"initial":null, "ordered":null});
            thisView.model.get("nonresourcesection").set({"initial":null, "ordered":null});
            
            thisView.render();
            return;
        }
            
        // Nodes that have a match to at least one a term
        var unionNodes = result.nodes.any;
            
        // Nodes that have a match to all terms
        var intersectionNodes = result.nodes.all;
            
        // Get nodes in the current graph
        var graphManager = application.graphstate;
            
        // Nodes that have a match to at least one a term AND are not in the current graph
        var unionIncludeNodes           = 0;

        // Nodes that have a match to at least one a term AND are not in the current graph
        var intersectionIncludeNodes    = 0;
            
        if(!graphManager.isEmpty()){
            var graphDefinition = graphManager.get();
            var graphNodes = new JsClass.Set(graphDefinition.getNodeIDs());

            if(unionNodes !== null){
                thisView.model.get("includeor").set("nodes", null);
                thisView.model.get("includeor").set("nodes", new JsClass.Set(unionNodes.map(function(node){
                    return node;
                })).difference(graphNodes));
            }

            if(intersectionNodes !== null){
                thisView.model.get("includeand").set("nodes", null);
                thisView.model.get("includeand").set("nodes", new JsClass.Set(intersectionNodes.map(function(node){
                    return node;
                })).difference(graphNodes));
            }
        }
        
        thisView.model.get("keywordor").set("nodes", null);
        thisView.model.get("keywordor").set("nodes", unionNodes);
        
        thisView.model.get("keywordand").set("nodes", null);
        thisView.model.get("keywordand").set("nodes", intersectionNodes);
            
        unionNodes = unionNodes.length;
        intersectionNodes = (intersectionNodes === null) ? 0 : intersectionNodes.length;
        
        

        // Get map collection
        //var mapCollection = Hub.get("map");

        // Get all maps sorted
        var maps = result.maps;
            
        // Max Slots
        var MAX_ROWS = 10;
        var MIN_RES = 2;
        var MIN_NONRES = 2;
            
        // res + numres < MAX_ROWS
        // res >= 2
        // nonres >=2
        var orderedResourceMaps = [];
        var orderedNoResourceMaps = [];

        Hub.getModels("map", maps).forEach(function(map){
            if(typeof map === "undefined" || map === null){
                return;
            }

            var resources = Hub.wrap(map).getUserResources();
            if(resources.length > 0){
                orderedResourceMaps.push(map);
            }else{
                orderedNoResourceMaps.push(map);
            }
        });
            
        // Set up initial non resource maps
        var initialNonResourceMaps = [];
        if(orderedNoResourceMaps.length <= MIN_NONRES){
            initialNonResourceMaps = orderedNoResourceMaps.map(function(d){
                return d;
            });
            orderedNoResourceMaps = [];
        }else{
            while(initialNonResourceMaps.length < MIN_NONRES){
                initialNonResourceMaps.push(orderedNoResourceMaps.shift());
            }
        }
            
        // Set up initial resource maps
        var initialResourceMaps = [];
        while(initialResourceMaps.length + initialNonResourceMaps.length < MAX_ROWS && orderedResourceMaps.length > 0){
            initialResourceMaps.push(orderedResourceMaps.shift());
        }

        // Fill any open spots
        while(initialResourceMaps.length + initialNonResourceMaps.length < MAX_ROWS && orderedNoResourceMaps.length > 0){
            initialNonResourceMaps.push(orderedNoResourceMaps.shift());
        }
        
        thisView.model.get("resourcesection").set({"initial":null, "ordered":null});
        thisView.model.get("nonresourcesection").set({"initial":null, "ordered":null});
        
        thisView.model.get("resourcesection").set({
            "initial": initialResourceMaps,
            "ordered": orderedResourceMaps
        });
        
        thisView.model.get("nonresourcesection").set({
            "initial": initialNonResourceMaps,
            "ordered": orderedNoResourceMaps
        });

        thisView.render();
    };
        
        /**
     * Change the omnisearch to mirror changes to the active graph.
     * @listens change:programState.activeGraph
     */
    pvt.delegateChangeActiveGraph = function (model, options) {
        var thisView = this;
        
        thisView.model.set("showall", false);
        var graphManager = application.graphstate;

        var updateTextbox = true;
        updateTextbox = updateTextbox && (!graphManager ? false : true);
        updateTextbox = updateTextbox && appstate.has("activeSubject");
        var updateOmniSearch = updateTextbox && thisView.model.get("omniSearchOpen");

        if (updateTextbox) {
            if (!graphManager.isEmpty()) {
                var mapDef = graphManager.get();
                if($.isNumeric(mapDef.graphID)){
                    // Get map 
                    var map = Hub.get("map").get(mapDef.graphID);
                    
                    // If the map cannot be found (e.g. it was dynamically created) then use the omnisearch term when its provided
                    var title = "_custom";
                    if(typeof map !== "undefined" && map !== null){
                        title = Hub.stripHtml(map.get("title"));
                        appstate.set("omnisearch", title);
                    }
                    
                    // Get the title of the graph
                    
                    
                    //var 
                    
                    //thisView.$el.find(pvt.consts.DOM_TEXTBOX).val(title);
                }else{
                    appstate.set("omnisearch", mapDef.graphID);
                    //thisView.$el.find(pvt.consts.DOM_TEXTBOX).val(mapDef.graphID);
                }
            }else{
                updateOmniSearch = true;
            }
        }

        /* 
         * Not sure why this is here. Commenting for now
         * 3/6/18: This is to update the results since we've changed the title. However, we don't want them to be visible until later
         */
        /*if (updateOmniSearch) {
            // Launch a second, simultaneous promise
            var response = thisView.model.get("searchResult").response;
            if (response !== null) {
                thisView.rerender();
            }
        }*/

        thisView.model.set("omniSearchOpen", false);
    };
    
    return View;
});
