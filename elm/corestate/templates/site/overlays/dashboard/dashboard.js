/* global gRoot */
define([
    "jquery",
    "backbone", 
    "hub-lib", 
    "activeGraph", 
    "text!./discussion-panel-template.html", 
    "mustache"],
function (
    $,
    Backbone, 
    Hub, 
    ActiveGraph, 
    DiscussionsTemplate, 
    Mustache
) {

    var pvt = {
        consts: {
            TEMPLATE_PATH: gRoot + "corestate/templates/site/overlays/dashboard/dashboard.php"
        }
    };

    var DashboardView = Backbone.View.extend({
        template: DiscussionsTemplate,
        events: {
            "click" : "delegateClick",
            "click .dashboard-Map-link": "delegateClickMapLink",
            "click .dashboard-Node-link": "delegateClickNodeLink",
            "click .dashboard-Resource-link": "delegateClickResourceLink"
        },    

        delegateClick: function(e){
            var thisView = this;
            thisView.model.get("programState").set({ dashboardOpen: false });
        },
        
        delegateClickMapLink: function(e){
            var thisView = this;
            e.preventDefault();
            
            var mapID = Number($(e.currentTarget).attr("obid"));
            ActiveGraph.loadGraph(thisView.model, mapID, {update: false, close: true});
            application.graphstate.apply({ activeWindow: "graph", dashboardOpen: false, sidePanel: "Discussion" });
        },
        
        delegateClickNodeLink: function(e){
            var thisView = this;
            var nodeID = Number($(e.currentTarget).attr("obid"));
            var graphManager = application.graphstate;
            
            var promisedAction = ActiveGraph.set(appstate, ("_" + nodeID), {update: false, close: true});
            return promisedAction.then(function(){
                var graphDef = graphManager.get();
                graphDef.graphID = (!graphDef.graphID[0] !== "_") ? "_custom" : graphDef.graphID;
                
                // Add the nodes
                graphDef.setNodeColor(nodeID, 1);

                // Update the program
                graphManager.set(graphDef);
                graphManager.apply({activeWindow: "graph", omniSearchOpen: false});
            });
        },
        
        delegateClickResourceLink: function(e){
            var thisView = this;
            var resourceID = Number($(e.currentTarget).attr("obid"));
            
            var records = Hub.get("mapresource").where({resourceid:resourceID}, false, Hub);
            if(records.length > 0){
                ActiveGraph.loadGraph(thisView.model, records[0].get("mapid"), {update: false, close: true});
                application.graphstate.apply({ activeWindow: "graph", dashboardOpen: false, sidePanel: "Discussion" });
            }
        },

        initialize: function () {
            var thisView = this;
            Backbone.View.prototype.initialize.apply(thisView);
            Mustache.parse(thisView.template);
            
            thisView.$el = $(thisView.el);
            thisView.model = new Backbone.Model({
                programState: thisView.model,
                id: 'dashboard-model',
                template: null
            });

            thisView.listenTo(thisView.model.get("programState"), "change:dashboardOpen", thisView.render);
        },

        render: function () {
            var thisView = this;
            
            
            var dashboardOpen = thisView.model.get("programState").get("dashboardOpen");
            if (dashboardOpen) {
                
                // If the template doesn't exist then go fetch it
                if(!thisView.model.has("template")){
                    thisView.model.set("template", true);

                    $.get(pvt.consts.TEMPLATE_PATH, function(ret){
                        var $newContent = $(ret);
                        thisView.$el.replaceWith($newContent);
                        thisView.setElement($newContent[0]);
                        thisView.render();
                    });

                    return;
                }else{
                    
                    var recent = pvt.getRecentDiscussions.call(thisView);
                    recent.posts = recent.posts.slice(0,10);
                    
                    var user = pvt.getUserDiscussions.call(thisView);
                    user.posts = user.posts.slice(0,10);
                    
                    thisView.$el.find(".recent-discussions").html($(Mustache.render(thisView.template, recent)));
                    thisView.$el.find(".your-discussions").html($(Mustache.render(thisView.template, user)));
                }
                
                thisView.$el.addClass("open");
            } else {
                thisView.$el.removeClass("open");
            }
        }
    });
    
    
    pvt.getRecentDiscussions = function(){
        var thisView = this;
        
        var msgs = Hub.get("msg").map(function(d){
            return d;
        });
        
        msgs.sort(function(a,b){
            var dateA = Date.parse(a.get("datecreated"));
            var dateB = Date.parse(b.get("datecreated"));
            return dateB - dateA;
        });
        
        return {
            posts: msgs.map(function(d){
                var post = Hub.get("post").get(d.get("postid"));
                var discussion = Hub.get("discussion").get(post.get("did"));
                var obtype = discussion.get("obtype");
                var obid = discussion.get("obid");
                var creatorid = post.get("creatorid");
                
                // Get the user
                var user = Hub.get("user").get(creatorid);
                if(typeof user === "undefined"){
                    user = "unknown user";
                }else{
                    user = user.get("email");
                }
                
                var name = pvt.getDiscussionName(obtype, obid);
                if(name === null){
                    return null;
                }
                
                var type = pvt.getDiscussionType(obtype);
                name = Hub.stripHtml(name);
                
                return {
                    userid: creatorid,
                    obid: obid,
                    name: name,
                    type: type,
                    date: Hub.stripHtml(d.get("datecreated")),
                    text: Hub.stripHtml(d.get("msg")),
                    user: Hub.stripHtml(user)
                };
            }).filter(function(d){
                return d !== null;
            })
        };
    };
    
    pvt.getUserDiscussions = function(){
        var thisView = this;
        var posts = pvt.getRecentDiscussions.call(thisView);
        
        posts.posts = posts.posts.filter(function(d){
            return d.userid === userID;
        });
        
        return posts;
    };
    
    pvt.getDiscussionName = function(obtype, obid){
        var name = null;
        switch(obtype){
            case "map":
                var model = Hub.get("map").get(obid);
                if(typeof model !== "undefined"){
                    name = model.get("title");
                }
                break;
            case "node":
                var model = Hub.get("node").get(obid);
                if(typeof model !== "undefined"){
                    name = model.get("title");
                }
                break;
            case "resource":
                var model = Hub.get("resource").get(obid);
                if(typeof model !== "undefined"){
                    name = model.get("title");
                }
                break;
            default:
                throw Error("Unknown type: " + obtype);
        }
        return name;
    };
    
    pvt.getDiscussionType = function(obtype){
        var name = null;
        switch(obtype){
            case "map":
                return "Map";
            case "node":
                return "Node";
            case "resource":
                return "Resource";
            default:
                throw Error("Unknown type: " + obtype);
        }
    };

    return DashboardView;
});