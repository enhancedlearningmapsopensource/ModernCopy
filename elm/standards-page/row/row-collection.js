define(["backbone", "./row-model"], function(Backbone, Model){
    return Backbone.Collection.extend({
        model: Model
    });
});