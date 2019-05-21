define(["backbone", "./live-map-table-model"], function(Backbone, Model){
    var Collection = Backbone.Collection.extend({
        model: Model
    });
});