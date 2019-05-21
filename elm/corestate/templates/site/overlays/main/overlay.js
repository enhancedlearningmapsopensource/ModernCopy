define([
    "backbone",
    "text!./overlays.php",
    "mustache",
    
    "corestate/templates/site/overlays/dashboard/dashboard",
    "corestate/templates/site/overlays/user-guide/user-guide",
    "corestate/templates/site/overlays/videos/videos",
    "corestate/templates/site/overlays/people/people"
], function (
    Backbone,
    Template,
    Mustache,
    
    DashboardOverlay,
    UserGuideOverlay,
    VideoOverlay,
    PeopleOverlay
) {

    var pvt = {
        consts: {
            OVERLAY_LST: [
                
                { dashboard: DashboardOverlay },
                {userguide: UserGuideOverlay},
                {videos: VideoOverlay},
                {people: PeopleOverlay}
            ]
        }
    };

    var OverlayView = Backbone.View.extend({
        template: Template,
        initialize: function(){
            var thisView = this;
            Mustache.parse(thisView.template);
            Backbone.View.prototype.initialize.apply(thisView);

            thisView.$el = $(Mustache.render(thisView.template, {}));

            application.views.overlays = {};
            var overlays = application.views.overlays;
            pvt.consts.OVERLAY_LST.forEach(function(ol){
                var keys = Object.keys(ol);
                overlays[ol] = new ol[keys[0]]({ 
                    id: keys[0]+'-overlay', 
                    model: thisView.model, 
                    el: thisView.$el.find("#"+keys[0]+"-overlay")[0] 
                });
            });

                //feedback: new FeedbackOverlay({ id: 'feedback-overlay', model: thisView.model, el: thisView.$el.find(pvt.consts.DOM_FEEDBACK)[0] }),
                //dashboard: new DashboardOverlay({ id: 'dashboard-overlay', model: thisView.model, el: thisView.$el.find(pvt.consts.DOM_DASHBOARD)[0] }),
               // bugtracker: new BugtrackerOverlay({ id: 'bugtracker-overlay', model: thisView.model, el: thisView.$el.find(pvt.consts.DOM_BUGTRACKER)[0] }),
            
        },

        render: function () {
            var thisView = this;
            Backbone.View.prototype.render.apply(thisView);

            var overlays = thisView.model.get("views").overlays;
            pvt.consts.OVERLAY_LST.forEach(function (ol) {
                var keys = Object.keys(ol);
                overlays[keys[0]].render();
            });
        }

    });

    return OverlayView;
});