define(["backbone",
        "mustache",
        "./bp-node-view",
        "./bp-edge-view",
        "text!./bottom-panel-template.html",
        "activeGraph",
        "hub-lib"], 
function(Backbone,
         Mustache,
         NodeView,
         EdgeView,
         Template,
         ActiveGraph,
         Hub){
    var pvt = {};
    var Panel = Backbone.View.extend({
        template: Template,
        events: {
            "click .bot-map": "delegateSelectMap",
            "click .bot-close-col": "delegateClose",
            "click a.bot-parent": "delegateSelectNode",
            "click a.bot-child": "delegateSelectNode",
            "click .bot-more": "delegateShowMore"
        },
        
        /**
         * Triggered when the user clicks on the 'close' button
         */
        delegateClose: function(e){
            e.preventDefault();
            
            appstate.get("selectedcircles").reset();
            appstate.set({
                "selectededge": null
            });
        },
        
        /**
         * @listens click:.bot-map
         */
        delegateSelectMap: function (e) {
            e.preventDefault();
            var thisView = this;
            var id = $(e.currentTarget).attr("id");
            id = Number(id.split("bot-node-")[1]);
            ActiveGraph.loadGraph(thisView.model, id, {close: true});
        },
        
        /**
         * Triggered when the user clicks on a parent/child link
         */
        delegateSelectNode: function(e){
            e.preventDefault();
            appstate.get("selectedcircles").reset();
            appstate.get("selectedcircles").add({
                id: Number($(e.currentTarget).attr("id").split("bot-node-")[1])
            });
            
            appstate.set({
                "selectededge": null
            });
        },
        
        /**
         * Triggered when the user clicks '# more ...' link
         */
        delegateShowMore: function (e) {
            var thisView = this;
            e.preventDefault();
            var $el = $(e.currentTarget);
            var classList = $el.parent("td")[0].getAttribute("class");

            thisView.$el.find(".bot-more").each(function (e) {
                $(this).parent("td").show();
            });
            $el.parent("td").hide();

            thisView.$el.find(".extra").each(function (e) {
                $(this).hide();
            });
            thisView.$el.find(".extra." + classList).each(function (e) {
                $(this).show();
            });
            return false;
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Mustache.parse(thisView.template);
            
            thisView.model = new Backbone.Model({
                id: 'bottom-panel-model',
                isvisible: true
            });
            
            // Set up the node view
            thisView.model.set("nodeview", new NodeView({
                id: 'bottom-panel-node-view'
            }));
            thisView.model.get("nodeview").render();
            
            // Set up the edge view
            thisView.model.set("edgeview", new EdgeView({
                id: 'bottom-panel-edge-view'
            }));
            thisView.model.get("edgeview").render();
            
            
            thisView.listenTo(appstate, "change:sideBarOpen", thisView.render);
            thisView.listenTo(appstate, "change:sidePanel", thisView.render);
            thisView.listenTo(appstate.get("selectedcircles"), "update", thisView.render);
            thisView.listenTo(appstate.get("selectedcircles"), "reset", thisView.render);
            thisView.listenTo(appstate, "change:selectededge", thisView.render);
            thisView.listenTo(Hub.get("node"), "update", thisView.render);
            thisView.listenTo(Hub.get("edge"), "update", thisView.render);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView        = this;
            var programState    = appstate;
            
            if(!thisView.model.has("isvisible") || typeof thisView.model.get("isvisible") === "undefined"){
                thisView.model.set("isvisible", true);
            }
            
            // Get the selected circle
            var circleSelected  = programState.get("selectedcircles");
            var edgeSelected    = programState.get("selectededge");
            
            if(circleSelected.length === 0 && edgeSelected === null){
                if(thisView.model.get("isvisible")){
                    thisView.model.set("isvisible", false);
                    thisView.$el.hide();
                }
                return;
            }
            
            var renderOb = {};
            
            // Detach
            thisView.model.get("nodeview").$el.detach();
            thisView.model.get("edgeview").$el.detach();
            
            // Get the title
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            if(!thisView.model.set("isvisible")){
                thisView.$el.show();
                thisView.model.set("isvisible", true);
            }
            
            // Get the first selected circle
            circleSelected = (circleSelected.length !== 1) ? null : circleSelected.at(0).id;
            if(circleSelected !== null && Hub.get("node").has(circleSelected)){
                // Get the node
                var currNode = Hub.get("node").get(circleSelected);
                var title = Hub.wrap(currNode).title();
                thisView.$el.find(".bot-header-col").html(title);
            }else{
                var title = thisView.model.get("edgeview").edgeTitle();
                thisView.$el.find(".bot-header-col").html(title.title);
                thisView.$el.find(".bot-header-col").html(title.title);
            }
            
            // Adjust for the side bar
            var sideBarOpen = programState.get("sideBarOpen");
            if (sideBarOpen) {
                thisView.$el.addClass("side-bar-open");
            } else {
                thisView.$el.removeClass("side-bar-open");
            }

            // Adjust for the side panel
            var sidePanelOpen = programState.get("sidepanelopen");
            if (sidePanelOpen === true) {
                thisView.$el.addClass("side-panel-open");
            } else if(sidePanelOpen === false) {
                thisView.$el.removeClass("side-panel-open");
            } else{
                throw Error("Invalid value for sidepanelopen");
            }
            
            // Reattach
            var $botContent = thisView.$el.find(".bot-content");
            $botContent.append(thisView.model.get("nodeview").$el);
            $botContent.append(thisView.model.get("edgeview").$el);
        }
    });
    
    pvt.showNodeID = function(){
        var pref = getPreference("NODEID_ON");
        if(pref === null){
            throw Error("Cannot find preference: NODEID_ON");
        }
        return (pref.localeCompare("t") === 0);
    };
    
    return Panel;
});

