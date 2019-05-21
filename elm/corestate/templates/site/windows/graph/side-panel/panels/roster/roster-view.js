define(["core", "constants", "text!./template.html", "mustache"],
function (Core, Constants, Template, Mustache){

    var pvt = {};

    var RosterView = Core.View.extend({	
        template: Template,
        
        initialize: function(){
            // Setup DOM  
            var thisView = this;    
            Mustache.parse(thisView.template);
            Core.View.prototype.initialize.call(thisView);
            thisView.listenTo(appstate, "change:sidePanel", pvt.sidePanelChanged);
        },
        
        render: function(){
            var thisView = this;
            
            var $el = $(Mustache.render(thisView.template, {path: gRoot}));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }        
    });
    
    pvt.sidePanelChanged = function(){
        var thisView = this;
        var sidePanel = appstate.get("sidePanel");
        if(sidePanel === null){
            return;
        }
        
        if(sidePanel.localeCompare(Constants.STRINGS.ROSTER) === 0){
            $(".site-body").addClass("roster");
            /*setTimeout(function(){
                thisView.$el.find(".launcherlink").click();
            }, 500);*/
        }else{
            $(".site-body").removeClass("roster");
        }
        
    };
    
    return RosterView;
});