define(["backbone", "./save-buttons-model"], function(Backbone, Model){
    var Collection = Backbone.Collection.extend({
        model: Model
    });
});