define(["backbone", "jquery"], function (Backbone, $) {

    var pvt = {
        consts: {
            AJAX: gRoot + "corestate/js/site/menu/ajax/update-preference.ajax.php"
        }
    };

    var MenuView = Backbone.View.extend({
        events: {
            "click #close-menu": "delegateCloseMenu",
            "change select" : "delegateChangeMultipleChoice"
        },

        delegateChangeMultipleChoice: function (e) {
            var thisView = this;
            var $el = $(e.currentTarget);

            var id = Number($el.attr("id").split("mc-")[1]);
            var val = $el.val();

            $.post(pvt.consts.AJAX, { prefID: id, value: val }, function (ret) {
                if (ret.trim().length > 0){
                    throw Error(ret);
                }
                thisView.model.get("managers").remove("user", userID);
            });
        },

        delegateCloseMenu: function(e){
            var thisView = this;
            thisView.model.set("menuOpen", false);
        },



        initialize: function () {
            var thisView = this;
            Backbone.View.prototype.initialize.apply(thisView);
            thisView.$el = $(thisView.el);

            thisView.listenTo(thisView.model, "change:menuOpen", thisView.render);
        },

        isReady: function () {
            return true;
        },


        render: function () {
            var thisView = this;
            
            var menuOpen = thisView.model.get("menuOpen");
            if (menuOpen) {
                thisView.$el.addClass("open");
            } else {
                thisView.$el.removeClass("open");
            }

        }

    });
    return MenuView;
});