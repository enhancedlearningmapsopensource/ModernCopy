/* 
 * PHP creation template
 * 
 * vars: 
 * nodetostandard - the name of the collection as all lowercase
 * UPP - the name of the collection as first upppercase
 */

/**
 * Database => Collection definition
 */
define(["require", "../remote-model"], function(require, Remote){
    
    var Set = {};
    
    Set.Model = Remote.Model.extend({
        defaults: {
            type: "nodetostandard"
        },
        urlRoot: function(){
            return require.toUrl("../ajax/model/nodetostandard.php");
        }
    });
    
    Set.Collection = Remote.Collection.extend({
        model: Set.Model,
        url: require.toUrl("../ajax/model/nodetostandard.php")
    });
    
    return Set;
});

