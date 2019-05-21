define(["backbone", "./delete-switch-model"], function(Backbone, Model){
    var Collection = Backbone.Collection.extend({
        model: Model
    });
});