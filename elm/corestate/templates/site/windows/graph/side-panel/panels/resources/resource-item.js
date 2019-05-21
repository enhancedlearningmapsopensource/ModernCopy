/* global gRoot, config */
define([
    "require",
    "jquery",
    "backbone",
    "mustache",
    "text!./resource-item.html",
    "activeGraph",
    "hub-lib",
    "corestate/_misc/resource-url-parser"],
function(
    require,
    $,
    Backbone,
    Mustache,
    Template,
    ActiveGraph,
    Hub,
    UrlParser
){

    var pvt = {
        consts: {TELEMETRY_PATH: "./add-resource-telemetry.php"}
    };
    var Item = Backbone.View.extend({
        template: Template,
        events: {
            "mouseover": "delegateHighlightNodes",
            "mouseleave": "delegateUnhighlightNodes",
            "click .link-attachment": "delegateFollowLink",
            "click .res-map-link": "delegateOpenMap",
            "click a": "delegateClickLink"
        },

        delegateClickLink: function(e){
            const $el = $(e.currentTarget);
            if($el.hasClass("link-attachment") || $el.hasClass("res-map-link")){
                return;
            }

            const $parent = $el.parents(".res-row");
            const resID = Number($parent.attr("id").split("resource-")[1]);
            const link = $el.attr("href");

            const url = require.toUrl(pvt.consts.TELEMETRY_PATH);
            $.post(url, {resourceid: resID, linkurl: link}, function(d){

            });

            console.warn("Log resource link clicked.");
        },

        delegateFollowLink: function(e){
            e.preventDefault();

            var pattern = "https://elmap.us/modern";

            var path = $(e.currentTarget).attr("href");
            if(path.substr(0,pattern.length) === "https://elmap.us/modern"){
                window.open(path, "_blank");
            }else{
                var r = confirm("Warning! You are about to leave the ELM software. Are you sure you want to continue?\n\nClick OK to continue to '"+path+"'\nClick Cancel to return to the ELM Software.");
                if (r === true) {
                    window.open(path, "_blank");
                }
            }
        },

        /**
         * Triggered when a user hovers over a resource entry. Highlights all nodes with the resource in an associated map.
         * @param {Event} e - the hover event
         */
        delegateHighlightNodes: function (e) {
            var thisView = this;

            // Get maps for this resource
            var maps = thisView.maps();

            // Get nodes associated with maps in this resource
            if(maps.length > 0){
                var nodeIDs = maps.map(function(d){
                    return Hub.wrap(d).nodeIDs();
                }).reduce(function(acc,val){
                    return acc.concat(val);
                });

                window.removeDuplicates(nodeIDs);


                // Get active map
                var activeMap = pvt.getCurrentMap.call(thisView);

                // Get nodes for active map
                var activeNodeIDs = Hub.wrap(Hub.get("map").get(activeMap)).nodeIDs();




                // Clear hovered circles
                var resourceNodeIDs = [];

                // Highlight any active node ids in the resource
                activeNodeIDs.forEach(function(d){
                    if($.inArray(d,nodeIDs) !== -1){
                        resourceNodeIDs.push(d);
                    }
                });

                window.highlightNodes(resourceNodeIDs);
            }
            return false;
        },

        /**
         * Open the map when the user clicks on its link
         */
        delegateOpenMap: function(e){
            var thisView = this;
            e.preventDefault();
            var id = Number($(e.currentTarget).attr("id").split("res-map-link-")[1]);
            ActiveGraph.loadGraph(thisView.model, id, {update: false, close: true});
            window.application.graphstate.apply({ activeWindow: "graph" });
        },

        /**
         * Triggered when a user moves the mouse away from any resource entry. Removes highlight from all nodes.
         * @param {Event} e - the hover event
         */
        delegateUnhighlightNodes: function(){
            window.unhighlightNodes();
        },

        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Mustache.parse(thisView.template);

            thisView.model = new Backbone.Model({
                resource: null,
                hidden: true,
                related: false
            });

            thisView.listenTo(appstate, "change:activeGraph", pvt.updateHidden);
            thisView.listenTo(appstate, "change:showallresources", pvt.showAllChanged);
            thisView.listenTo(appstate, "change:sidePanel", pvt.updateHidden);
            thisView.listenTo(thisView.model, "change:hidden", thisView.render);
            thisView.listenTo(thisView.model, "change:related", thisView.render);
            thisView.listenTo(thisView.model, "change:resource", function(){
                thisView.listenTo(thisView.model.get("resource"), "change", thisView.render);
                pvt.updateHidden.call(thisView);
            });
            thisView.listenTo(Hub.get("resource"), "update", pvt.updateHidden);
            thisView.listenTo(Hub.get("sharedresource"), "update", pvt.updateHidden);
            thisView.listenTo(Hub.get("mapresource"), "add", pvt.mapResourceLinkAddedOrRemoved);
            thisView.listenTo(Hub.get("mapresource"), "remove", pvt.mapResourceLinkAddedOrRemoved);
            thisView.listenTo(Hub.get("file"), "update", thisView.render);
        },

        /**
         * Get maps visible to user that contain this resource.
         * return {number[]} - ids of maps containing resource & visible to user
         */
        maps: function(){
            var thisView = this;
            return pvt.getMaps.call(thisView);
        },

        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            if(thisView.model.get("hidden") === true && thisView.model.get("related") === false){
                return;
            }

            var maps = pvt.getMaps.call(thisView);
            var activeMap   = pvt.getCurrentMap.call(thisView);
            var formattedMaps = maps.map(function(map){
                // if(map.id === activeMap){
                //     showable = true;
                // }
                return {
                    title: Hub.stripHtml(map.get("title")),
                    mapid: map.id
                };
            });

            // Check whether we need to display a link to the resource
            var showLink = maps.reduce(function(acc,val){
                return (acc || val.id === activeMap);
            }, false);

            var resource = thisView.model.get("resource");
            var title = Hub.stripHtml(resource.get("title"));

            showLink = showLink || (resource.get("creatorid") === userID);

            // Create the resource render object
            var renderOb = {
                id: resource.id,
                title: title,
                description: Hub.stripHtml(resource.get("description")),
                maps: formattedMaps,
                multimap: (formattedMaps.length > 1),
                isfile: false,
                ispdf: false,
                ismissing: false,
                path: gRoot,
                elmiconpath: config.ICON_PATH
            };

            // Clear attachments
            renderOb.attachments = [];

            // Parse the resource url
            var attachments = UrlParser(resource.get("url"));
            if(attachments === null){
                // Old pdf attachment
                var resLink = Hub.wrap(resource).link();
                if(Hub.stripHtml(resource.get("bashtimestamp")) !== "n/a"){
                    renderOb.attachments = [{
                        path: resLink,
                        ispdf: true,
                        name: Hub.stripHtml(resource.get("title"))
                    }];
                    renderOb.link = (!showLink) ? false : Hub.stripHtml(Hub.wrap(resource).link());
                }else{
                    renderOb.link = (!showLink) ? false : Hub.stripHtml(resource.get("url").replace("../../../../modernalpha/","../"));
                }
            }else{
                // Moderncopy attachment set
                renderOb.attachments = attachments.map(function(d){
                    var path = "";
                    var name = "";

                    if(d.type === "file"){
                        name = d.name;
                        path = Hub.get("file").get(d.fileid).get("url").replace("../../../../../modernalpha/","../");
                    }else if(d.type === "link"){
                        path = d.url;
                        if(path.substr(0,4) !== "http"){
                            path = "http://" + path;
                        }
                        name = "Link: " + path;
                    }else if(d.type === "missing"){
                        name = "file missing";
                        path = "";
                    }

                    // If the name matches the resource title then it becomes the main link
                    if(d.name === title){
                        renderOb.link = path;
                    }

                    // Add the attachment, formatted for rendering
                    return {
                        path: path,
                        name: name,
                        isfile: (d.type === "file"),
                        ismissing: (d.type === "missing")
                    };
                });
            }
            renderOb.has = {
                attachments: (renderOb.attachments.length > 0),
                description: (renderOb.description.trim().length > 0)
            };

            // Fix link relative to the moderncopy folder
            if(typeof renderOb.link === "string"){
                renderOb.link = renderOb.link.replace("../assets", "../elm/assets");
            }

            /*var creatorID = resource.get("creatorid");
            var isAdmin = false;
            if(creatorID === -1){
                isAdmin = true;
            }else{
                var creator = Hub.wrap(Hub.get("user").get(creatorID));
                isAdmin = creator.isAdmin();
            }*/

            // Get maps for resource
            renderOb.elm = false;
            var mapresources = Hub.get("mapresource").where({resourceid: resource.id}, false, Hub);

            // Get maps
            var maps = mapresources.map(function(d){
                return Hub.get("map").get(d.get("mapid"));
            }).filter(function(d){
                return typeof d !== "undefined";
            });

            // If any public then set elm = true
            if(maps.length > 0){
                for(var i = 0; i < maps.length; i++){
                    if(Hub.wrap(maps[i]).ownerStatus() === "elm"){
                        renderOb.elm = true;
                        break;
                    }
                }
            }


            //renderOb.elm = isAdmin && (resource.get("ispublic") === 1);

            // Prevents attachments from showing up
            renderOb.attachments = false;

            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }
    });

    /**
     * Get maps associated with the resource AND visible to the user
     * @return {Backbone.Model[]} - maps associated with the resource AND visible to the user
     */
    pvt.getMaps = function(){
        var thisView = this;
        if(!thisView.model.has("maps")){
            var resID = thisView.model.get("resource").id;

            // Get maps associated with resource
            var resMaps = Hub.get("mapresource").where({resourceid: resID}).filter(function(record){
                return Hub.get("map").has(record.get("mapid"));
            });

            // Maps associated with the resource by the user
            var userResMaps = [];

            // Maps associated with the resource by an admin
            var adminResMaps = [];

            resMaps.forEach(function(d){
                if(d.get("editorid") === userID){
                    userResMaps.push(d.get("mapid"));
                }else{
                    var editorID = d.get("editorid");
                    if(editorID === 0){
                        editorID = 1;
                    }
                    var editor = Hub.get("user").get(editorID);
                    if(Hub.wrap(editor).isAdmin()){
                        adminResMaps.push(d.get("mapid"));
                    }
                }
            });
            thisView.model.set("maps", userResMaps.concat(adminResMaps));
        }

        // Get map models
        var permittedMaps = Hub.getModels("map", thisView.model.get("maps"));

        // Filter maps visible to user
        return permittedMaps.filter(function(map){
            return (map.get("ispublic") === 1 || map.get("creatorid") === userID);
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

    pvt.mapResourceLinkAddedOrRemoved = function(model, options){
        var thisView = this;
        if(model.get("resourceid") === thisView.model.get("resource").id){
            if(thisView.model.has("maps")){
                thisView.model.set("maps", null);
            }
            pvt.updateHidden.call(thisView);
        }
    };

    /**
     * Shows or hides element based on input
     * @param {boolean} showOn - true shows the content while false hides it
     * @return {boolean} the given value of showOn
     */
    /*pvt.show = function(showOn){
        var thisView = this;
        if(!showOn){
            thisView.$el.hide();
        }else{
            thisView.$el.show();
        }
        return showOn;
    };*/

    /**
     * Removes the highlighting from all nodes
     */
    pvt.removeNodeHighlighting = function () {
        $("g.hovered").each(function (e) {
            $(this).removeClass("hovered");
        });
    };

    pvt.showAllChanged = function(model, value){
        var thisView = this;
        if(value === true){
            thisView.model.set("hidden", false);
        }else{
            pvt.updateHidden.call(thisView);
        }
    };

    pvt.updateHidden = function(){
        var thisView = this;
        var resource = thisView.model.get("resource");
        var showAll = appstate.get("showallresources");

        // Check page state
        var sidePanel = appstate.get("sidePanel");

        if(showAll === false && (resource === null || sidePanel !== "Resources")){
            thisView.model.set("hidden", true);
            return;
        }

        if(Hub.stripHtml(resource.get("title")) === "3.OA.1-3 Student Word Documents Combined"){
            var q= 0;
        }

        var activeMap   = pvt.getCurrentMap.call(thisView);
        var maps        = pvt.getMaps.call(thisView);
        var showable    = maps.reduce(function(acc,val){
            return acc || (val.id === activeMap);
        }, false);

        if(showAll === false && (!showable)){
            thisView.model.set("hidden", true);
            return;
        }

        // Hide if there are no visible maps
        /*if(!pvt.show.call(thisView, showable)){

        }*/
        thisView.model.set("hidden", false);
    };



    return Item;
});
