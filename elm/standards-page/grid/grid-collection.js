define(["backbone", "./grid-model"], function(Backbone, Model){
    return Backbone.Collection.extend({
        model: Model
    });
});