define(["require", "./remote-model"], function(require, Remote){
    return Remote.Model.extend({
        defaults:{
            testserverval: "testserverval"
        },
        
        urlRoot: function(){
            return require.toUrl("./ajax/utility/test-server.php");
        }
    });
});

