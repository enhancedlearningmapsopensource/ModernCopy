define(["backbone", "./grid-tile-model"], function(Backbone, Model){
    return Backbone.Collection.extend({
        model: Model
    });
});