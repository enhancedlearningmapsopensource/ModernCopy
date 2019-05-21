define(["backbone", "./table-model"], function(Backbone, Model){
    return Backbone.Collection.extend({
        model: Model
    });
});