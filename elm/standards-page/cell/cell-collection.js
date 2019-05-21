define(["backbone", "./cell-model"], function(Backbone, Model){
    return Backbone.Collection.extend({
        model: Model
    });
});