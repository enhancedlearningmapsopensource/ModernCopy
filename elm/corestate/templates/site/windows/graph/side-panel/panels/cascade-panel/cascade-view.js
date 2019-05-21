/* global appstate, application*/
define([
    "jquery",
    "core", 
    "constants", 
    "text!./template.php", 
    "mustache",
    "cascade-plugin-tools/questionviewer/questionviewer",
    "cascade-plugin-tools/testviewer/testviewer",
],
function (
    $,
    Core, 
    Constants, 
    Template, 
    Mustache,
    QuestionViewer,
    TestViewer
){

    var pvt = {};

    var RosterView = Core.View.extend({	
        template: Template,
        cascadePlugin: null,
        $screen: null,
        
        initialize: function(){
            var thisView = this;    
            Mustache.parse(thisView.template);
            Core.View.prototype.initialize.call(thisView);

            thisView.listenTo(appstate, "change:sidePanel", pvt.sidePanelChanged);

            application.cascadeplugin.addTool(QuestionViewer);
            application.cascadeplugin.addTool(TestViewer);


        },
        
        render: function(){
            var thisView = this;
            /*return;

            if($("#cascade-screen").length === 0 && $("#graph-wrapper").length > 0){
                $("#graph-wrapper").after(thisView.$screen);
            }*/

            application.cascadeplugin.menu.$el.detach();//.cascadePlugin.menu.$el.detach();
            //thisView.cascadePlugin.screen.$el.detach();

            var $el = $(Mustache.render(thisView.template, {}));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            thisView.$el.append(application.cascadeplugin.menu.$el);


            /*if(thisView.$screen !== null){
                thisView.$screen.append(thisView.cascadePlugin.$screen);
            }*/
        }        
    });

    pvt.activeWindowChanged = function(model){
        let thisView = this;
        const activeWindow = model.get("activeWindow");

        if(activeWindow === "graph"){
            pvt.sidePanelChanged.call(thisView, model);
        }
    };

    pvt.createCascadeScreen = function(){
        let thisView = this;
        let $wrapper = $("#graph-wrapper");
        if($wrapper.length > 0){
            thisView.$screen = $wrapper.clone();
            thisView.$screen.attr("id", "cascade-screen");
            thisView.$screen.css("display", "block");
            thisView.$screen.css("background-color", "white");
            thisView.$screen.addClass("side-panel-open");
            thisView.$screen.find("svg").detach();
            $wrapper.css("display", "none");
        }
        thisView.$screen.detach();
    };
    
    pvt.preSiteRender = function(){
        let thisView = this;
        if(thisView.$screen !== null){
            thisView.$screen.detach();
        }
    };

    pvt.sidePanelChanged = function(model){
        const sidePanel = model.get("sidePanel");
        appstate.set("cascadeopen", (sidePanel === Constants.STRINGS.CASCADE));
    };
    
    return RosterView;
});