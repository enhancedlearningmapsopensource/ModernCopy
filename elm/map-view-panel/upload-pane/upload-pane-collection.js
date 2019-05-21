define(["backbone", "./upload-pane-model"], function(Backbone, Model){
    var Collection = Backbone.Collection.extend({
        model: Model
    });
});