define(["backbone", "./panel-model"], function(Backbone, Model){
    var Collection = Backbone.Collection.extend({
        model: Model
    });
});