define(["backbone",
        "mustache",
        "text!./map-resource-table.html",
        "hub-lib"], 
function(Backbone,
         Mustache,
         Template,
         Hub){
             
    var pvt = {};         
    var View = Backbone.View.extend({     
        template: Template,
        events: {
            "click .btn-resource-back": "delegateBack",
            "click .btn-upload": "delegateUpload",
            "click .glyphicon-trash": "delegateRemoveResource",
            "click .btn-reject-remove": "delegateCancelRemoveResource",
            "click .btn-confirm-remove": "delegateConfirmRemoveResource",
            "click .edit-resource": "delegateEditResource"
        },
        
        delegateBack: function(e){
            var thisView = this;
            e.preventDefault();
            thisView.model.set("map", null);
        },
        
        /**
         * User clicks the "Back" button in the confirmation window
         */
        delegateCancelRemoveResource: function(e){
            var thisView = this;
            thisView.model.set("resourcetoremove", null);
        },
        
        /**
         * User clicks the "Remove Resource" button in the confirmation window
         */
        delegateConfirmRemoveResource: function(e){
            var thisView = this;
            var resourceid = thisView.model.get("resourcetoremove");
            
            var res = Hub.get("mapresource").where({
                mapid: thisView.model.get("map").id,
                resourceid: resourceid
            }, false, Hub);
            assert(res.length === 1);
            res = res[0];
            
            Hub.sendUserNotification("Removing resource.");
            var lockID = lockSite(true, "remove resource from map");
            return res.destroy({wait:true}).then(function(){
                thisView.model.set("resourcetoremove", null);
                lockSite(false, lockID);
            });
        },
        
        delegateEditResource: function(e){
            var thisView = this;
            e.preventDefault();
            
            var id = Number($(e.currentTarget).parents("tr:first").attr("id").split("resource-")[1]);
            thisView.model.set("resourcetoedit", Hub.get("resource").get(id));
            thisView.model.set("resourcetoedit", null);
        },
        
        delegateUpload: function(e){
            var thisView = this;
            e.preventDefault();
            thisView.model.set("filemap", thisView.model.get("map"));
            thisView.model.set("filemap", null);
        },
        
        delegateRemoveResource: function(e){
            var thisView = this;
            e.preventDefault();
            
            var id = Number($(e.currentTarget).parents("tr:first").attr("id").split("resource-")[1]);
            thisView.model.set("resourcetoremove", id);
        },

        
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Mustache.parse(thisView.template);
            
            thisView.model.set({
                "map": null,
                "filemap": null,
                "resourcetoremove": null,
                "resourcetoedit": null
            });
            
            thisView.listenTo(thisView.model, "change:map", thisView.render);
            thisView.listenTo(thisView.model, "change:resourcetoremove", thisView.render);
            thisView.listenTo(Hub.get("mapresource"), "update", thisView.render);
            thisView.listenTo(Hub.get("resource"), "change:title", thisView.render);
            thisView.listenTo(Hub.get("resource"), "change:description", thisView.render);
            thisView.listenTo(Hub.get("resource"), "change:url", thisView.render);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var map = thisView.model.get("map");
            if(map === null){
                return;
            }
            
            var formattedRes = [];
            var resourceToRemove = null;
            
            if(thisView.model.get("resourcetoremove") === null){
                var resources = Hub.wrap(map).getUserResources();
                var formattedRes = resources.map(function(d){
                    return {
                        nm: Hub.stripHtml(d.get("title")),
                        desc: Hub.stripHtml(d.get("description")),
                        id: d.id,
                        ext: (Hub.stripHtml(d.get("url")).split(".")).pop()
                    };
                });
            }else{
                resourceToRemove = Hub.stripHtml(Hub.get("resource").get(thisView.model.get("resourcetoremove")).get("title"));
            }
            
            var renderOb = {
                mapName: Hub.stripHtml(map.get("title")),
                mapDesc: Hub.stripHtml(map.get("description")),
                resources: formattedRes,
                confirmremove: (resourceToRemove !== null),
                toremove: resourceToRemove
            };
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }
    });
    return View;
});