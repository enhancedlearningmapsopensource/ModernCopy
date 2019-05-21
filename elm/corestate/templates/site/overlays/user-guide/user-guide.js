define(["backbone"],
function (Backbone) {

    var pvt = {
        consts: {
            
        }
    }

    var UserGuideView = Backbone.View.extend({
        events: {
            "click" : "delegateClick",
        },    

        delegateClick: function(e){
            var thisView = this;
            thisView.model.set({ userguideOpen: false });
        },

        initialize: function () {
            var thisView = this;
            Backbone.View.prototype.initialize.apply(thisView);

            thisView.$el = $(thisView.el);

            thisView.listenTo(thisView.model, "change:userguideOpen", thisView.render);
        },

        render: function () {
            var thisView = this;
            var dashboardOpen = thisView.model.get("userguideOpen");
            if (dashboardOpen) {
                thisView.$el.addClass("open");
            } else {
                thisView.$el.removeClass("open");
            }
        }
    });

    return UserGuideView;
});