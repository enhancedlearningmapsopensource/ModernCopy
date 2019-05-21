define(["backbone",
        "mustache",
        "text!./map-table-row.html",
        "hub-lib",
        "activeGraph"], 
function(Backbone,
         Mustache,
         Template,
         Hub,
         ActiveGraph){
             
    var pvt = {};         
    var View = Backbone.View.extend({     
        template: Template,
        events: {
           "click .maptitle-link" : "delegateActivateMap",
           "click .glyphicon-edit" : "delegateEditMap",
           "click .glyphicon-upload" : "delegateUploadMap",
           "click .glyphicon-trash": "delegateDelete",
           "click .glyphicon-arrow-left": "delegateResurect"
        },
        
        delegateActivateMap: function(e){
            var thisView = this;
            var servermodel = thisView.model.get("servermodel");
            e.preventDefault();
            
            return ActiveGraph.loadGraph(appstate, servermodel.id, {close: true});
        },
        
        delegateEditMap: function(e){
            var thisView = this;
            if(!thisView.isActive()){
                thisView.delegateActivateMap.call(thisView, e);
            }
            thisView.model.set("edit", true);
            thisView.model.set("edit", false);
        },
        
        /**
         * Triggered when the user clicks the 'trash can icon' beside a map
         * @param {type} e - the event
         * @returns {unresolved}
         */
        delegateDelete: function (e) {
            var thisView = this;
            var map = thisView.model.get("servermodel");
            map.set({datedeleted: "now"});
            return map.save({wait:true});
        },
        
        delegateResurect: function (e) {
            var thisView = this;
            e.preventDefault();
            var map = thisView.model.get("servermodel");
            map.set("datedeleted", TIME_ZERO);
            return map.save({wait:true});
        },
        
        delegateUploadMap: function(e){
            var thisView = this;
            if(!thisView.isActive()){
                thisView.delegateActivateMap.call(thisView, e);
            }
            thisView.model.set("upload", true);
            thisView.model.set("upload", false);
        },
        
        dayStamp: function(){
            var thisView = this;
            var servermodel = thisView.model.get("servermodel");
            var d = thisView.formattedDate().split("/");
            return (365*Number(d[2])) + (30*Number(d[0])) + Number(d[1]);
        },
        
        formattedDate: function(){
            var thisView = this;
            var servermodel = thisView.model.get("servermodel");
            var d = new Date(servermodel.get("datecreated"));
            return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Mustache.parse(thisView.template);
            thisView.listenTo(appstate, "change:activeGraph", thisView.render);
            thisView.listenTo(thisView.model.get("servermodel"), "change", thisView.render);
            thisView.listenTo(Hub.get("map"), "update", thisView.render);
            thisView.listenTo(Hub.get("map"), "reset", thisView.render);
        },
        
        isDeleted: function(){
            var thisView = this;
            var servermodel = thisView.model.get("servermodel");
            return (servermodel.get("datedeleted") !== null && (servermodel.get("datedeleted") !== TIME_ZERO || servermodel.get("datedeleted") === "0000-00-00 00:00:00"));
        },
        
        isActive: function(){
            var thisView = this;
            var servermodel = thisView.model.get("servermodel");
            if (!application.graphstate.isEmpty()) {
                var active = ActiveGraph.getServerModel();
                return (typeof active !== "undefined" && active !== null && active.id === servermodel.id);
            }else{
                return false;
            }
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var servermodel = thisView.model.get("servermodel");
            
            if(!servermodel.hasOwnProperty("collection")){
                if(Hub.get("map").has(servermodel.id)){
                    thisView.model.set("servermodel", Hub.get("map").get(servermodel.id));
                    servermodel = thisView.model.get("servermodel");
                    thisView.listenTo(thisView.model.get("servermodel"), "change", thisView.render);
                }else{
                    return;
                }
            }
            
            var renderOb = {
                mapid: servermodel.id,
                date: thisView.formattedDate(),
                desc: Hub.stripHtml(servermodel.get("description")),
                title: Hub.stripHtml(servermodel.get("title")),
                deleted: thisView.isDeleted(),
                active: thisView.isActive(),
                hasresource: (Hub.wrap(servermodel).getUserResources().length > 0),
                path: gRoot
            };
            
            var mapManagerScrollTop = $("#mapmanagermain").scrollTop();
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            $("#mapmanagermain").scrollTop(mapManagerScrollTop);
            
            thisView.$el.find('[data-toggle="tooltip"]').each(function(e){
                $(this).tooltip();
            });
        },
        
        searchTerm: function(){
            var thisView = this;
            var servermodel = thisView.model.get("servermodel");
            return [
                Hub.stripHtml(servermodel.get("title")), 
                thisView.formattedDate(), 
                Hub.stripHtml(servermodel.get("description"))].join(" ");
        }        
    });
    return View;
});