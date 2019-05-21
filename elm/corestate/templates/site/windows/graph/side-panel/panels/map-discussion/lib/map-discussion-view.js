/* global application */

define(["core",
        "text!../templates/discussion-multi.html",
        "text!../templates/discussion-type.html",
        "text!../templates/post-template.html",
        "mustache",
        "activeGraph",
        "../discussion-manager/discussion-manager",
        "./discussion-type-view"],
function (Core,
          Template,
          TypeTemplate,
          PostTemplate,
          Mustache,
          ActiveGraph,
          DiscussionManager,
          DiscussionTypeView) {
              
            var pvt = {};
            pvt.consts = {                
                TEMPLATE_MAP: {
                    main: "#main-template",
                    post: "#post-template",
                    type: "#discussion-type-template"
                }
            };
            

            var MapDiscussionView = Core.View.extend({
                template: Template,
                typeTemplate: TypeTemplate,
                postTemplate: PostTemplate,
                events:{
                    "click .btn-reply" : "clickPostButton",
                    "click .btn-edit" : "clickPostButton",
                    "click .btn-delete" : "clickPostButton",
                    "click .btn-cancel-edit" : "cancelDiag",
                    "click .btn-cancel-reply" : "cancelDiag",
                    "click .btn-cancel-newtopic" : "closeNewDiag",
                    "click .delete-cancel-btn" : "cancelDiag",
                    "click .delete-confirm-btn" : "deletePost",
                    "click .btn-start-topic" : "startTopic",
                    "click .btn-submit-newtopic" : "submitTopic",
                    "click .btn-submit-edit" : "editText",
                    "click .btn-submit-reply" : "reply",
                    "click .post-drop" : "changePostView",
                    "click h4.section-heading" : "toggleSection",
                    "click .btn-feedback" : "openFeedbackSurvey"
                },
                
                initialize: function(){
                    var thisView = this;
                    Core.View.prototype.initialize.call(thisView);
                    Mustache.parse(thisView.template);
                    Mustache.parse(thisView.typeTemplate);
                    Mustache.parse(thisView.postTemplate);
                    
                    // Load the templates
                    /*var templates = {};
                    Object.keys(pvt.consts.TEMPLATE_MAP).forEach(function(t){
                        templates[t] = thisView.$el.find(pvt.consts.TEMPLATE_MAP[t]).html();
                        Mustache.parse(templates[t]);
                        if (typeof templates[t] === 'undefined' || templates[t] === null) {
                            throw Error("invalid template: " + t);
                        }
                    });*/
                    
                    // Create a view to handle the discussion type
                    var discTypeView = new DiscussionTypeView({
                        id: 'discussion-type-view',
                        model: new Backbone.Model({
                            id: 'discussion-type-model',
                            template: thisView.typeTemplate,
                            programState: appstate
                        })
                    });
                    
                    // Set up the model
                    var discussionManager = new DiscussionManager(application.datainterface);
                    thisView.model = new Backbone.Model({
                        programState: appstate,
                        state: discussionManager.initialState(),
                        templates: {
                            main: thisView.template,
                            post: thisView.postTemplate
                        },
                        discussionManager: discussionManager,
                        discussionType: discTypeView,
                        showstart: true
                    });
                    
                    thisView.listenTo(appstate, "change:activeGraph", thisView.render);
                    thisView.listenTo(appstate, "change:activeSubject", thisView.render);
                    thisView.listenTo(appstate, "change:sidePanel", thisView.render);
                },
                
                render: function(){
                    var thisView = this;
                    var templates = thisView.model.get("templates");
                    var state = thisView.model.get("state");
                    var programState = thisView.model.get("programState");
                    var discussionManager = thisView.model.get("discussionManager");
                    var subject = programState.get("activeSubject");
                    var graphID = pvt.getGraphID.call(thisView);
                    var graphState = application.graphstate;
                    
                    if(programState.get("sidePanel") !== "Map Discussion" /* legacy */ && programState.get("sidePanel") !== "Discussion"){
                        thisView.$el.hide();
                        return;
                    }else{
                        thisView.$el.show();
                    }
                    
                    var nodeIDs = ActiveGraph.getNodes(programState);
                    return discussionManager.process(state, graphID, nodeIDs, subject).then(function(data){
                        data.showstartbtn = !graphState.isEmpty();
                        data.showstart = (thisView.model.get("showstart"));
                        data.path = gRoot;
                        thisView.$el.html(Mustache.render(templates.main, data, {row: templates.post}));

                        var $discType = $("#discussion-type");
                        if($discType.length > 0){
                            thisView.model.get("discussionType").setElement($discType[0]);
                            thisView.model.get("discussionType").render();
                        }
                        return;
                    });
                },
                
                
                
                //===========================================
                // Events
                //===========================================
                changePostView: function(e){
                    var thisView = this;
                    
                    var $el = $(e.currentTarget);
                    var buttonType = pvt.getButtonType($el);
                    
                    // Update state
                    var state = thisView.model.get("state");
                    var id = pvt.getPostID($el);
                    if(state[buttonType + "Open"].contains(id)){
                        state[buttonType + "Open"].remove(id);
                    }else{
                        state[buttonType + "Open"].add(id);
                    }
                    
                    // Render the updated state
                    thisView.render();
                },
                
                cancelDiag: function(e){
                    var thisView = this;
                    
                    var $el = $(e.currentTarget);
                    var buttonType = pvt.getButtonType($el);
                    
                    // Update state
                    var state = thisView.model.get("state");
                    var id = pvt.getPostID($el);
                    if(state[buttonType + "DiagOpen"].contains(id)){
                        state[buttonType + "DiagOpen"].remove(id);
                    }else{
                        throw Error("shouldn't be able to click this.");
                    }
                    
                    // Render the updated state
                    thisView.render();
                },
                
                clickPostButton: function(e){
                    var thisView = this;
                    
                    var $el = $(e.currentTarget);
                    var buttonType = pvt.getButtonType($el);
                    
                    // Update state
                    var state = thisView.model.get("state");
                    var id = pvt.getPostID($el);
                    if(!state[buttonType + "DiagOpen"].contains(id)){
                        state[buttonType + "DiagOpen"].add(id);
                    }else{
                        throw Error("shouldn't be able to click this.");
                    }
                    
                    // Render the updated state
                    thisView.render();
                },
                
                closeNewDiag: function(e){
                    var thisView = this;
                    e.preventDefault();
                    
                    // Cancel the new topic
                    thisView.model.set("showstart", true);
                    
                    // Render the updated state
                    thisView.render();
                },
                
                deletePost: function(e){
                    var thisView = this;
                    
                    var $el = $(e.currentTarget);
                    
                    var id = pvt.getPostID($el);
                    var programState = thisView.model.get("programState");
                    var discussionManager = thisView.model.get("discussionManager");
                    var subject = programState.get("activeSubject");
                    var graphID = pvt.getGraphID.call(thisView);
                    var nodeIDs = ActiveGraph.getNodes(programState);
                    
                    // Update state
                    var state = thisView.model.get("state");
                    Object.keys(state).forEach(function(s){
                        if(s != "sections"){
                            state[s].remove(id);
                        }
                    });
                    
                    return thisView.model.get("discussionManager").deletePost(id, graphID, nodeIDs, subject).then(function(){
                        return thisView.render();
                    });
                },
                
                editText: function(e){
                    var thisView = this;
                    
                    var $el = $(e.currentTarget);
                    
                    var id = pvt.getPostID($el);
                    var programState = thisView.model.get("programState");
                    var discussionManager = thisView.model.get("discussionManager");
                    var subject = programState.get("activeSubject");
                    var graphID = pvt.getGraphID.call(thisView);
                    var nodeIDs = ActiveGraph.getNodes(programState);
                    
                    // Update state
                    var state = thisView.model.get("state");
                    Object.keys(state).forEach(function(s){
                        if(s != "sections"){
                            state[s].remove(id);
                        }
                    });
                    
                    var newMsg = $("#ta-edit-" + id).val();
                    
                    return thisView.model.get("discussionManager").editPost(id, graphID, nodeIDs, subject, newMsg).then(function(){
                        thisView.render();
                    });
                },
                
                openFeedbackSurvey: function(e){
                    var thisView = this;
                    e.preventDefault();
                    window.open("https://kansasedu.qualtrics.com/jfe/form/SV_cGDTmds1fHOXxNH");
                },
                
                reply: function(e){
                    var thisView = this;
                    
                    var $el = $(e.currentTarget);
                    
                    var id = pvt.getPostID($el);
                    var programState = thisView.model.get("programState");
                    var discussionManager = thisView.model.get("discussionManager");
                    var subject = programState.get("activeSubject");
                    var graphID = pvt.getGraphID.call(thisView);
                    var nodeIDs = ActiveGraph.getNodes(programState);
                    
                    // Update state
                    var state = thisView.model.get("state");
                    Object.keys(state).forEach(function(s){
                        if(s != "sections"){
                            state[s].remove(id);
                        }
                    });
                    
                    var replyMsg = $("#ta-reply-" + id).val();
                    
                    return thisView.model.get("discussionManager").reply(id, graphID, nodeIDs, subject, replyMsg).then(function(){
                        thisView.render();
                    });
                },
                
                startTopic: function(e){
                    var thisView = this;
                    thisView.model.set("showstart", false);
                    thisView.render();
                },
                
                submitTopic: function(e){
                    var thisView = this;                    
                     // Get data from the discussion type
                    var discTypeView = thisView.model.get("discussionType");
                   
                    
                     // Validate the discussion type form
                    if(!discTypeView.validate()){
                        thisView.render();
                        return;
                    }
                    thisView.model.set("showstart", true);
                    
                    var type = discTypeView.getType();
                    var obID = null;
                    var msg = $("#ta-start-topic").val();
                    
                    // Get the focused object's id
                    switch(type){
                        case "map":
                            obID = Number(ActiveGraph.getGraphID(thisView.model.get("programState")));
                            break;
                        case "node":
                            obID = discTypeView.getNode();
                            break;
                        case "resource":
                            obID = discTypeView.getResource();
                            break;
                        default: 
                            throw Error("Unknown type: " + type);
                    }
                    
                    var lockID = lockSite(true, "map-discussion-view.js::submitTopic");
                    return thisView.model.get("discussionManager").startNewTopic(type, obID, msg).then(function(){
                        lockSite(false, lockID);
                        thisView.render();
                    });
                },
                
                toggleSection: function(e){
                    var thisView = this;
                    var $el = $(e.currentTarget);
                    
                    var type = $el.parents(".section").attr("id").split("section-")[1];
                    var state = thisView.model.get("state");
                    state.sections[type] = !state.sections[type];
                    return thisView.render();
                }
            });
            
            pvt.getGraphID = function(){
                var thisView = this;
                var graphID = ActiveGraph.getGraphID(thisView.model.get("programState"));
                return ($.isNumeric(graphID) ? Number(graphID) : graphID);
            };
            
            /**
             * Get post ID from an event on a control within a discussion row
             * @param {Element} $el - JQuery el
             * @returns {number} - the post id
             */
            pvt.getPostID = function($el){
                return Number($el.parents(".disc-row").attr("id").split("post-")[1]);
            };
            
            pvt.getButtonType = function($el){
                if($el.hasClass("type-reply")){
                    return "rep";
                }else if($el.hasClass("type-edit")){
                    return "edit";
                }else if($el.hasClass("type-delete")){
                    return "del";
                }
            }
                
            return MapDiscussionView;
        });