define(["backbone"],
function (Backbone) {
    var VideosView = Backbone.View.extend({
        events: {
            "click" : "delegateClick"
        },    

        delegateClick: function(e){
            var thisView = this;
            thisView.model.set({ peopleOpen: false });
        },

        initialize: function () {
            var thisView = this;
            Backbone.View.prototype.initialize.apply(thisView);

            thisView.$el = $(thisView.el);

            thisView.listenTo(thisView.model, "change:peopleOpen", thisView.render);
        },

        render: function () {
            var thisView = this;
            var videosOpen = thisView.model.get("peopleOpen");
            if (videosOpen) {
                thisView.$el.addClass("open");
            } else {
                thisView.$el.removeClass("open");
            }
        }
    });

    return VideosView;
});