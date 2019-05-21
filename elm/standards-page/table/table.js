define(["core",
        "mustache",
        "text!./table.html",
        "hub-lib",
        "../row/row",
        "../column/column"], 
function(Core,
         Mustache,
         Template,
         Hub,
         Row, 
         Column){
             
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
            
            thisView.listenTo(Hub.get("domaingroup"), "add", pvt.domainGroupAdded);
            thisView.listenTo(Hub.get("standardcolumn"), "add", pvt.standardColumnAdded);
            thisView.listenTo(thisView.model.get("rows"), "add", pvt.rowAdded);
            thisView.listenTo(thisView.model.get("columns"), "add", pvt.columnAdded);
            thisView.listenTo(thisView.model.get("cells"), "change:selected", pvt.cellSelectedChanged);
            thisView.listenTo(appstate, "change:standardcellsselected", pvt.changeAppStateSelectedCells);
            
            // Add any standardcolumns that already exist
            Hub.get("standardcolumn").forEach(function(column){
                pvt.standardColumnAdded.call(thisView, column);
            });
            
            // Add any domaingroups that already exist
            Hub.get("domaingroup").forEach(function(domain){
                pvt.domainGroupAdded.call(thisView, domain);
            });
            
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {
                subject: Hub.stripHtml(thisView.model.get("subject").get("name")).toLowerCase()
            };
            
            // Detach
            var rows = thisView.detachGroup("row-views");
            var columns = thisView.detachGroup("column-views");
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            // Sort
            columns.sort(function(a,b){
                return a.model.get("hubmodel").get("ord") - b.model.get("hubmodel").get("ord");
            });
            
            // Reattach
            var $rows = thisView.$el.find(".subject-table-rows");
            rows.forEach(function(d){
                $rows.append(d.$el);
            });
            
            var $columns = thisView.$el.find(".subject-table-columns");
            columns.forEach(function(d){
                $columns.append(d.$el);
            });
        }
    });
    
    pvt.cellAdded = function(model){
        var thisView = this;
        thisView.model.get("columns").forEach(function(column){
            column.addCell(model);
        });
        thisView.model.get("cells").add(model);
    };
    
    pvt.cellSelectedChanged = function(model){
        var thisView = this;
        var totalSelected = thisView.model.get("cells").reduce(function(acc,val){
           return acc + (val.get("selected") === true ? 1 : 0) ;
        },0);
        
        setTimeout(function(){
            var selectedNow = thisView.model.get("cells").reduce(function(acc,val){
                return acc + (val.get("selected") === true ? 1 : 0) ;
            },0);
            if(totalSelected === selectedNow){
                var selectedCells = thisView.model.get("cells").filter(function(d){
                    return (d.get("selected") === true);
                }).map(function(d){
                    return d.get("hubmodel").id;
                });
                selectedCells.sort();
                
                // Get the selected cells right now
                var selectedNow = appstate.get("standardcellsselected");
                
                // Separate by subject
                var subjects = selectedNow.trim().length === 0 ? [] : selectedNow.split("|").map(function(d){;
                    return d.split(",");
                });
                
                // Find this subject
                var foundSubject = false;
                for(var i = 0; i < subjects.length; i++){
                    if(Number(subjects[i][0]) === thisView.model.get("subject").id){
                        // Replace the entry
                        foundSubject = true;
                        subjects[i] = [thisView.model.get("subject").id].concat(selectedCells);
                        break;
                    }
                }
                
                if(!foundSubject){
                    subjects.push([thisView.model.get("subject").id].concat(selectedCells));
                }
                
                // Repackage
                subjects = subjects.map(function(d){
                    return d.join(",");
                });
                
                subjects = subjects.join("|");
                
                
                appstate.set("standardcellsselected",subjects);
            }
        }, 100);
    };
    
    pvt.changeAppStateSelectedCells = function(model){
        var thisView = this;
        var selectedCells = appstate.get("standardcellsselected");
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
        cellIDs.forEach(function(d){
            if(thisView.model.get("cells").has(d)){
                thisView.model.get("cells").get(d).set("selected", true);
            }
        });
    };
    
    pvt.domainAdded = function(model){
        // Listen for cells added to the domain
        var thisView = this;
        thisView.listenTo(model.get("cells"), "add", pvt.cellAdded);
        
        // Add existing
        model.get("cells").forEach(function(d){
            pvt.cellAdded.call(thisView, d);
        });
    };
    
    pvt.domainGroupAdded = function(model){
        var thisView = this;
        var rows = thisView.model.get("rows");
        var roword = model.get("roword");
        
        if(!rows.has(roword)){
            rows.add({
                id: roword,
                subject: thisView.model.get("subject")
            });
        }
    };
    
    pvt.rowAdded = function(model){ 
        var thisView = this;
        thisView.addToGroup("row-views", new Row({
            id: model.id,
            model: model
        }), model.id).render();
        thisView.render();
        
        // Listen for any domains added
        thisView.listenTo(model.get("domains"), "add", pvt.domainAdded);
        
        // Add existing
        model.get("domains").forEach(function(d){
            pvt.domainAdded.call(thisView, d);
        });
    };
    
    pvt.standardColumnAdded = function(model){ 
        var thisView = this;
        var modelSubject = model.get("subjectid");
        var tableSubject = thisView.model.get("subject").id;
        
        if(modelSubject !== tableSubject){
            return;
        }
        
        var columns = thisView.model.get("columns");
        columns.add({
            id: model.id,
            subject: thisView.model.get("subject"),
            hubmodel: model
        });
    };
    
    pvt.columnAdded = function(model){ 
        var thisView = this;
        thisView.addToGroup("column-views", new Column({
            id: model.id,
            model: model
        }), model.id).render();
        thisView.render();
    };
    
    
    return View;
});