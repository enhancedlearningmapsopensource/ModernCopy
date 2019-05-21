define(["require", "backbone", "./remote-model"], function(require, Backbone, Remote){
    return Remote.Model.extend({
        defaults:{
            id: 'server-model',
            collections: new Backbone.Collection()
        },
        
        urlRoot: function(){
            return require.toUrl("./ajax/utility/server.php");
        }
    });
});


