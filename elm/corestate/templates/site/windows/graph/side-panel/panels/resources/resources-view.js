/* global appstate */

define(["core",
        "backbone",
        "mustache",
        "text!./template.html",
        "./resource-item",
        "activeGraph",
        "hub-lib"], 
function(Core,
         Backbone,
         Mustache,
         Template,
         ResourceItem,
         ActiveGraph, 
         Hub){
    var pvt = {};
    
    var SidePanel = Core.View.extend({
        template: Template,
        events: {
            "click .manage-resources": "delegateManageResources",
            "click #show-all-btn": "delegateShowAll"
        },
        
        /**
         * Triggered when the user clicks the "My Resources" button
         */
        delegateManageResources: function(e){
            var thisView = this;
            e.preventDefault();
            
            // Open the resouce manager
            appstate.set("resourceManagerOpen", true);
        },
        
        /**
         * User clicks "Show All Resources"
         */
        delegateShowAll: function(e){
            e.preventDefault();
            appstate.set("showallresources", true);
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            thisView.model = new Backbone.Model({
                id: "resource-panel-model",
                items: new Backbone.Collection(),
                isvisible: true
            });
            
            thisView.listenTo(appstate, "change:activeGraph", pvt.activeGraphChanges);
            thisView.listenTo(Hub.get("resource"), "add", pvt.addResource);
            thisView.listenTo(thisView.model.get("items"), "change:hidden", pvt.itemHiddenChanged);
            thisView.listenTo(appstate, "change:showallresources", thisView.render);

            Hub.get("resource").forEach(function(d){
                pvt.addResource.call(thisView,d);
            });
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {
                showall: (appstate.get("showallresources") === true)
            };
            
            
            //var sidePanel = appstate.get("sidePanel");
	    //if (sidePanel !== null && sidePanel.localeCompare("Resources") === 0) {
                // Detach items
                var items = thisView.model.get("items").map(function(d){
                    return d;
                });
                items.forEach(function(item){
                    item.get("view").$el.detach();
                });
                
                // Sort
                pvt.sort(items);
                
                // Define 'has'
                renderOb.has = {
                    adminres: (items[0].length > 0),
                    userres: (items[1].length > 0),
                    relatedres: (items[2].length > 0),
                    resourcemanager: (typeof ResourceManager !== "undefined")
                };
                
                // Render
                var $el = $(Mustache.render(thisView.template, renderOb));
                thisView.$el.after($el);
                thisView.$el.remove();
                thisView.setElement($el[0]);
                
                
                // Reattach Reosource Items
                pvt.attachItems.call(thisView, ".admin-resources",      items[0]);
                pvt.attachItems.call(thisView, ".user-resources",       items[1]);
                pvt.attachItems.call(thisView, ".related-resources",    items[2]);
                
                
                //if(!thisView.model.get("isvisible")){
                //    thisView.$el.show();
                //}
            //}else{
            //    if(thisView.model.get("isvisible")){
            //        thisView.$el.hide();
            //   }
            //}
        }
    });
    
    pvt.activeGraphChanges = function(model){
        var thisView = this;
        appstate.set("showallresources", false);
        thisView.render();
    },
    
    /**
     * Triggered when a new resource model is added to the collection
     * @param {type} model
     * @param {type} options
     * @return {undefined}
     */
    pvt.addResource = function(model, options){
        var thisView = this;
        
        var items = thisView.model.get("items");
        var nwItem = new ResourceItem({
            id: "resource-item-" + model.id
        });
        nwItem.model.set("resource", model);
        nwItem.model.set("view", nwItem);
        nwItem.render();
        items.add(nwItem.model);
    };
    
    /**
     * Attach the given items to the given DOM table
     * @param {string} tableSelector - table selector to attach items to
     * @param {ResourceItem[]} items - items to attach
     */
    pvt.attachItems = function(tableSelector, items){
        var thisView = this;
        // Only attempt if more than one item is present
        if(items.length === 0){
            return;
        }
        var selector = tableSelector + " > table > tbody";
        var $table = thisView.$el.find(selector);
        if($table.length === 0){
            throw Error("Could not find table: '" + selector + "'");
        }
        items.forEach(function(item){
            $table.append(item.get("view").$el);
        });
    };
    
    pvt.getCurrentMap = function(){
        var activeGraphID = ActiveGraph.getGraphID(appstate);
        var showAllResources = appstate.get("showAllResources");
        if(activeGraphID === "custom"){
            return null;
        }
        
        if(!$.isNumeric(activeGraphID)){
            return null;
        }
        return activeGraphID;
    };
    
    pvt.itemHiddenChanged = function(model, options){
        var thisView = this;
        var itemID = model.id;
        thisView.model.set("lastItemHiddenChanged", itemID);
        
        setTimeout(function(){
            if(thisView.model.get("lastItemHiddenChanged") === itemID){
                thisView.render();
            }
        },100);
    };
    
    
    
    pvt.sort = function(items, activeMap){
        // Divide into:
        // a. Visible
        // b. Not Visible
        
        var visible = [];
        var hidden = [];
        
        items.forEach(function(d){
            if(d.get("hidden") === true){
                hidden.push(d);
            }else{
                visible.push(d);
            }
        });
        
        // Divide visible into:
        // a. Admin resources
        // b. User resources
        var admin = [];
        var user = [];
        pvt.divideAdminVsUser(visible, admin, user);
        
        // Get active map
        var activeMap = pvt.getCurrentMap();
        if(activeMap === null){
            // Clear items array
            items.splice(0,items.length);
            items.push([]);
            items.push([]);
            items.push([]);
            return;
        }
        
        // Get nodes in active map
        var nodes =  [];
        if(Hub.get("map").has(activeMap)){
            nodes = Hub.wrap(Hub.get("map").get(activeMap)).nodeIDs();
        }
        
        
        // Get maps attached to nodes
        var maps = Hub.getModels("node", nodes).map(function(node){
            return Hub.wrap(node).mapIDs();
        }).reduce(function(acc,val){
            return acc.concat(val);
        }, []);
        removeDuplicates(maps);
        
        // Filter out the active map
        for(var i = 0; i < maps.length; i++){
            if(maps[i] === activeMap){
                maps.splice(i,1);
                break;
            }
        }
        
        // Figure out which of the hidden resources appear in a related map
        var relatedResources = hidden.filter(function(d){
            var hiddenResMaps = d.get("view").maps();
            for(var i = 0; i < hiddenResMaps.length; i++){
                if($.inArray(hiddenResMaps[i].id, maps) !== -1){
                    return true;
                }
            }
            return false;
        });
        
        // Make related resources visible
        relatedResources.forEach(function(d){
            d.set("related", true);
        });
        
        // Divide related resources into 
        // a. Admin related
        // b. User related
        var adminRelated = [];
        var userRelated = [];
        pvt.divideAdminVsUser(relatedResources, adminRelated, userRelated);
        
        
        // Assemble sets
        // 1. Admin
        // 2. User (Heading: My Resources)
        // 3. Related Admin (Heading: Related)
        // 4. Related User (No heading)
        var sets = [
            admin,
            user,
            adminRelated,
            userRelated
        ];
        
        // Sort by name
        sets.forEach(function(d){
            d.sort(function(a,b){
                var titleA = Hub.stripHtml(a.get("resource").get("title"));
                var titleB = Hub.stripHtml(b.get("resource").get("title"));
                return titleA.localeCompare(titleB);
            });
        });
        
        // Clear items array
        items.splice(0,items.length);
        
        items.push(sets[0]);
        items.push(sets[1]);
        items.push(sets[2].concat(sets[3]));
    };
    
    /**
     * Divide given resources into admin & user owned
     * @param {ResourceItem[]} resources - the resources to divide
     * @param {ResourceItem[]} admin - the resources owned by an admin
     * @param {ResourceItem[]} user - the resources owned by a user
     */
    pvt.divideAdminVsUser = function(resources, admin, user){
        resources.forEach(function(d){
            if(Hub.stripHtml(d.get("resource").get("title")) === "3.OA.1-3 Student Word Documents Combined"){
                var q= 0;
            }

            
            if(d.get("resource").get("creatorid") === userID){
                user.push(d);
            }else{
                admin.push(d);
            }
        });
    };

    return SidePanel;
});
