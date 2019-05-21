define(["backbone", "./filter-model"], function(Backbone, Model){
    var Collection = Backbone.Collection.extend({
        model: Model
    });
});