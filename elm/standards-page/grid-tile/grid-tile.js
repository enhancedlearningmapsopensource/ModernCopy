define(["core",
        "mustache",
        "text!./grid-tile.html",
        "hub-lib",
        "activeGraph"], 
function(Core,
         Mustache,
         Template,
         Hub,
         ActiveGraph){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {
            "click .map-title-bar": "delegateSelectMap",
            "click .more" : "delegateClickShowMore",
            "click .less" : "delegateClickShowLess"
        },
        
        /**
         * Triggered when a user clicks 'show more...'
         */
        delegateClickShowMore: function(e){
            var thisView = this;
            var $el = $(e.currentTarget);
            $el.parents(".shell").addClass("open");
    	},

        /**
         * Triggered when a user clicks '... done'
         */
        delegateClickShowLess: function(e){
            var thisView = this;
            var $el = $(e.currentTarget);
            $el.parents(".shell").removeClass("open");
    	},
        
        /**
         * Triggered when a user clicks a map title
         */
        delegateSelectMap: function(e){
            var thisView = this;
            var $el = $(e.currentTarget);
            var graphID = $el.parents(".s-res-cell:first").attr("id");
            graphID = graphID.split("s-res-cell-")[1];
            
            if($.isNumeric(graphID)){
                ActiveGraph.loadGraph(thisView.model, graphID, {update: false, close: true});
                application.graphstate.apply({ activeWindow: "graph" });
            }else{
                // Open a blank graph
                return ActiveGraph.set(thisView.model, "_" + graphID, {update: false, close: true}).then(function(){
                    var graphManager = application.graphstate;
                    var graphDef = graphManager.get();
                    graphDef.graphID = "_" + graphID;
                    
                    // Add necessary nodes
                    if(thisView.model.has("nodes")){
                        thisView.model.get("nodes").forEach(function(nodeID){
                            graphDef.setNodeColor(nodeID, "red");
                        });
                    }

                    // Update the program
                    graphManager.set(graphDef);
                    graphManager.apply({activeWindow: "graph", omniSearchOpen: false});

                    // Since the graph has changed, remove the search results
                    thisView.model.set("prevResult", null);
                });
            }
        },
        
        
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            thisView.listenTo(appstate, "change:hidenonresmaps", pvt.checkVisible);
            thisView.listenTo(appstate, "change:hidenonelmmaps", pvt.checkVisible);
            
            pvt.checkVisible.call(thisView);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var map = thisView.model.get("hubmodel");
            var wrap = Hub.wrap(map);
            var owner = wrap.ownerStatus();
            
            var renderOb = {
                title: Hub.stripHtml(map.get("title")),
                desc: Hub.stripHtml(map.get("description")),
                elm: owner === "elm",
                u: owner === "user",
                resources: (wrap.getUserResources().length > 0),
                mapid: map.id,
                path: gRoot,
                elmiconpath: config.ICON_PATH
            };
            
            renderOb[wrap.colorStatus()] = true;
            
            // Get standard ids
            var nodes = wrap.nodeIDs();
            
            if(nodes.length > 0){
                var sids = Hub.getModels("node", nodes).filter(function(nodeid){
                    return (typeof nodeid !== "undefined");
                }).map(function(node){
                    return Hub.wrap(node).getSIDs();
                }).reduce(function(acc, val){
                    return acc.concat(val);
                }, []);
                removeDuplicates(sids);

                if(sids.length > 0){
                    // Get standard information
                    var standards = Hub.getModels("simplestandard", sids).filter(function(d){
                        return typeof d !== "undefined";
                    });                    
                    renderOb.standards = standards.map(function(standard){
                        return {
                            textid: Hub.stripHtml(standard.get("textid")),
                            desc: Hub.stripHtml(standard.get("description"))
                        };
                    });
                }
            }
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            if(typeof $.tooltip === "function"){
                thisView.$el.find('[data-toggle="tooltip"]').each(function(e){
                    $(this).tooltip();
                });
            }
        },
        
        postattach: function(){
            var thisView = this;
            var $gridContent = thisView.$el.find(".grid-content");
            var avaliableHeight = $gridContent.height();
            var contentHeight = 0;
            $gridContent.find(".row").each(function(e){
                contentHeight += $(this).height();
            });
            
            if(avaliableHeight > 0 && contentHeight > avaliableHeight){
                thisView.$el.addClass("content-hidden");
            }
        }
    });
    
    pvt.checkVisible = function(model){
        var thisView = this;
        var hidenonresmaps = appstate.get("hidenonresmaps");
        var hidenonelmmaps = appstate.get("hidenonelmmaps");
        
        var map = thisView.model.get("hubmodel");
        var wrap = Hub.wrap(map);
        var owner = wrap.ownerStatus();
        var hasres = (wrap.getUserResources().length > 0);
        
        if(hidenonresmaps === true && hasres === false){
            thisView.model.set("filtered",true);
        }else if(hidenonelmmaps === true && owner !== "elm"){
            thisView.model.set("filtered",true);
        }else{
            thisView.model.set("filtered",false);
        }
    };
    
    
    return View;
});
