define(["backbone", "./table-pane-model"], function(Backbone, Model){
    var Collection = Backbone.Collection.extend({
        model: Model
    });
});