define(["backbone", "./view"], function(Backbone, View){
    return {
        View: View,
        Model: Backbone.Model,
        Collection: Backbone.Collection
    };
});
