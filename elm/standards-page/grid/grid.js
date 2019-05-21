define(["core",
        "mustache",
        "text!./grid.html",
        "hub-lib",
        "search-engine-lib",
        "ranker-lib",
        "search-engine-final/map-generator",
        "../grid-section/grid-section"], 
function(Core,
         Mustache,
         Template,
         Hub,
         SearchEngine,
         Ranker,
         Generator,
         Section){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {
            "change #hide-non-resource-maps" : "delegateChangeHasResource",
            "change #hide-user-maps" : "delegateChangeHasElmView"
        },
        
        /**
         * Triggered when user clicks 'Hide standards without resources'
         */
        delegateChangeHasResource: function(e){
            appstate.set("hidenonresmaps", $(e.currentTarget).prop("checked"));
        },
        
         /**
         * Triggered when user clicks 'Hide standards without ELM map views'
         */
        delegateChangeHasElmView: function(e){
            appstate.set("hidenonelmmaps", $(e.currentTarget).prop("checked"));
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            thisView.listenTo(appstate, "change:standardcellsselected", pvt.selectedCellsChanged);
            thisView.listenTo(appstate, "change:hidenonresmaps", thisView.render);
            thisView.listenTo(appstate, "change:hidenonelmmaps", thisView.render);
            thisView.listenTo(thisView.model, "change:hasactivecell", thisView.render);
            thisView.listenTo(thisView.model.get("sections"), "add", pvt.sectionAdded);
            thisView.listenTo(thisView.model.get("sections"), "change:visible", thisView.render);
            thisView.listenTo(Hub.get("map"), "change:datedeleted", pvt.mapDeleteStatusChange);
            thisView.listenTo(Hub.get("map"), "add", pvt.hubMapAdded);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            
            // Filter render calls
            var calledAt = Date.now();
            thisView.model.set("rendertime", calledAt);
            setTimeout(function(){
                var selectedCells = appstate.get("standardcellsselected");
                if(thisView.model.get("rendertime") !== calledAt){
                    return;
                }
                
                var renderOb = {
                    hidechecks: (!thisView.model.get("hasactivecell")),
                    hidenores: appstate.get("hidenonresmaps"),
                    hidenonelm: appstate.get("hidenonelmmaps")
                };

                // Detach
                var sections = thisView.detachGroup("section-views");
                //renderOb.hasresmaps = thisView.model.hasResMaps();
                //renderOb.haselmmaps = thisView.model.hasElmMaps();
                renderOb.nonelm = thisView.model.countNonElmMaps();
                renderOb.nonres = thisView.model.countNonResourceMaps();

                // Filter visible sections
                sections = sections.filter(function(d){
                    return (d.model.get("visible") === true);
                });            

                var $el = $(Mustache.render(thisView.template, renderOb));
                thisView.$el.after($el);
                thisView.$el.remove();
                thisView.setElement($el[0]);     
                
                // Filter sections alphabetically
                sections.sort(function(a,b){
                    return Hub.stripHtml(a.model.get("title")).localeCompare(Hub.stripHtml(b.model.get("title")));
                });

                var $sections = thisView.$el.find(".sections");
                sections.forEach(function(d){
                    if(d.model.get("visible") === true){
                        $sections.append(d.$el);
                        d.postattach();
                    }
                });
            }, 100);
        }
    });
    
    pvt.hubMapAdded = function(model){
        var thisView = this;
        if(model.id < 0){
            return;
        }else{
            pvt.mapDeleteStatusChange.call(thisView);
        }
    };
    
    pvt.mapDeleteStatusChange = function(){
        var thisView = this;
        SearchEngine.reset("map");
        pvt.selectedCellsChanged.call(thisView);
    };
    
    pvt.search = function(searchArr){
        var thisView = this;
        
        // Perform a search for the terms
        var engineResults = Ranker.grid(SearchEngine.search({
            value: searchArr
        }));
        
        // Get dynamic maps
        var dynamicMapTextIDs = engineResults.map(function(result){
            return result.dynamic.map(function(d){
                return d.name.value;
            });
        }).reduce(function(acc, val){
            return acc.concat(val);
        }, []);
         
        // Perform generation on all dynamic maps at once to save time later
        Generator.generateMaps(dynamicMapTextIDs);
        
        return engineResults;
    };
    
    pvt.sectionAdded = function(model){
        var thisView = this;
        thisView.addToGroup("section-views", new Section({
            id: model.id,
            model: model
        }), model.id).render();
        thisView.render();
    };
    
    pvt.selectedCellsChanged = function(){
        var thisView = this;
        // Hide all sections
        var sections = thisView.model.get("sections");
        sections.forEach(function(d){
            d.set("visible", false);
        });
        
        var selectedCells = appstate.get("standardcellsselected");
        if(selectedCells.trim().length > 0){
            pvt.processSelectedCells.call(thisView, sections, selectedCells)
        }
    };
    
    pvt.processSelectedCells = function(sections, selectedCells){
        var thisView = this;
        
        var subjectSplit = selectedCells.trim().length === 0 ? [] : selectedCells.split("|").map(function(d){;
            return d.split(",");
        });
        
        // Find this subject
        var cellSet = [];
        for(var i = 0; i < subjectSplit.length; i++){
            if(Number(subjectSplit[i][0]) === thisView.model.get("subject").id){
                // Replace the entry
                cellSet = subjectSplit[i].slice(1);
                break;
            }
        }
        
        var cellIDs = cellSet.map(function(d){
            return Number(d);
        });
        
        
        thisView.model.set("hasactivecell", (cellIDs.length > 0));
        
        
        // Get cell hub models
        var cellModels = cellIDs.map(function(d){
            return Hub.get("cell").get(d);
        });
        
        // Get cell names
        var cellNames = cellModels.map(function(d){
            return Hub.stripHtml(d.get("name"));
        });
        
        // Get the active subject
        var activeSubject = Hub.get("subject").filter(function(d){
            return Hub.stripHtml(d.get("name")).toLowerCase() === appstate.get("activeSubject");
        });
        assert(activeSubject.length === 1);
        activeSubject = activeSubject[0];
        
        var results = pvt.search.call(thisView, cellNames);
        
        // Hide all active sections
        thisView.model.get("sections").forEach(function(section){
            section.setResults(null);
        });
        
        results.forEach(function(d, i){
            var model = cellModels[i];
            var domain = Hub.get("domaingroup").get(model.get("domaingroupid"));
            var columnIndex = Hub.wrap(model).columnIndex();
            
            // Get the column
            var column = pvt.getColumnAtIndex(columnIndex, activeSubject.id);
            
            var grade = column.get("name");
            var domain = domain.get("name");
            
            var sectionTitle = grade + " " + domain;
            
            // Check for section
            if(!sections.has(sectionTitle)){
                sections.add({
                    id: sectionTitle,
                    title: sectionTitle
                });
            }
            
            // Get section
            var section = sections.get(sectionTitle);
            
            // Set section results
            section.setResults(d);
        });
    };
    
    /**
     * Get the column at the given index
     * @param {number} columnIndex - the index of the column
     * @param {number} subjectid - the subject id
     * @return {HubModel} - the column
     */
    pvt.getColumnAtIndex = function(columnIndex, subjectid){
        var column = Hub.get("standardcolumn").where({
            subjectid: subjectid
        }, false, Hub);
        
        column.sort(function(a,b){
            return a.get("ord") - b.get("ord");
        });
        column = column[columnIndex];
        return column;
    };
    
    return View;
});