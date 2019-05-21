define(["backbone", "./column-model"], function(Backbone, Model){
    return Backbone.Collection.extend({
        model: Model
    });
});