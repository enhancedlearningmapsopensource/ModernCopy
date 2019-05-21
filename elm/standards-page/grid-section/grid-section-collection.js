define(["backbone", "./grid-section-model"], function(Backbone, Model){
    return Backbone.Collection.extend({
        model: Model
    });
});