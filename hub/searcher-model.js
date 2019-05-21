define(["require", "backbone"], function(require, Backbone){
    var Searcher = Backbone.Model.extend({
        defaults: {
            "searchers": {}
        },  
        
        preconfigure: function(){
            var thisModel = this;
            
            return new Promise(function(resolve, reject){
                var files = thisModel.get("searchers").map(function(f){
                    return "./searchers/" + f + "-searcher";
                });
                require(files, function(){
                    var required = arguments;
                    thisModel.get("searchers").forEach(function(name, i){
                        thisModel.set(name, required[i]);
                    });
                    resolve();
                });
            });
        },
        
        search: function(name, id){
            var thisModel = this;
            if(!thisModel.has(name)){
                throw Error("Unrecognized name: " + name);
            }
            return thisModel.get(name)(name, id);
            
            /*if(!thisModel.has(model.get("type"))){
                throw Error("Cannot wrap model of type: " + model.get("type") + " No such wrapper exists.");
            }else{
                return thisModel.get(model.get("type"))(model);
            }*/
        }
    });
    
    return Searcher;
});


