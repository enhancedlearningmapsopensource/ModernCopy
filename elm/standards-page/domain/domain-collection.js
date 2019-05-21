define(["backbone", "./domain-model"], function(Backbone, Model){
    return Backbone.Collection.extend({
        model: Model
    });
});