define(['backbone'], function(Backbone){
    return Backbone.View.extend({
        
        changeActiveGraph: function(){
            var thisView = this;
            
            var graphManager = application.graphstate;
            var external = thisView.external();
            
            if(graphManager.isEmpty()){
                external.set("currentmap", null);
            }else{
                var graphDef = graphManager.get();
                if($.isNumeric(graphDef.graphID)){
                    external.set("currentmap", graphDef.graphID);
                }
            }
            thisView.closeResourceManager();
        },
        
        /**
         * Get the external connection to the resource manager
         * @return {Backbone.Model}
         */
        external: function(){
            var thisView = this;
            return thisView.model.get("resourcemanager").model.get("utility").get("external");
        },
        
        openResourceManager: function(){
            var thisView = this;
            var external = thisView.external();
            external.set("close", !appstate.get("resourceManagerOpen"));
        },
        
        closeResourceManager: function(){
            var thisView = this;
            var external = thisView.external();
            if(external.get("close")){
                appstate.set("resourceManagerOpen", false);
            }
        },
        
        /**
         * Triggered when then side panel is changed. Close resource manager if the roster
         * (which is generally larger than the other menus) is opened
         */
        changeSidePanel: function(){
            var thisView = this;
            if(appstate.get("sidePanel") === "Student Locater Tool"){
                var external = thisView.external();
                external.set("close", true);
            }
        },
        
        /**
         * Initialize the roster manager interface
         * @param {Object} options
         * @param {ResourceManagerMain} resourcemanager - the resource manager
         */
        initialize: function(options){
            var thisView = this;
            thisView.model = new Backbone.Model({
                resourcemanager: options.resourcemanager
            });
            thisView.openResourceManager();
            
            var external = thisView.external();
            thisView.listenTo(external, "change:close", thisView.closeResourceManager);
            thisView.listenTo(appstate, "change:activeWindow", thisView.closeResourceManager);
            thisView.listenTo(appstate, "change:activeGraph", thisView.changeActiveGraph);
            thisView.listenTo(appstate, "change:sidePanel", thisView.changeSidePanel);
            thisView.listenTo(appstate, "change:resourceManagerOpen", thisView.openResourceManager);
        }
    });
});

