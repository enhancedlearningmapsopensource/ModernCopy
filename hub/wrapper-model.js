define(["require", "backbone"], function(require, Backbone){ 
    var Wrapper = Backbone.Model.extend({
        defaults: {
            "wrappers": {}
        },  
        
        preconfigure: function(){
            var thisModel = this;
            
            return new Promise(function(resolve, reject){
                var files = thisModel.get("wrappers").map(function(f){
                    return "./wrappers/" + f + "-wrapper";
                });
                require(files, function(){
                    var required = arguments;
                    thisModel.get("wrappers").forEach(function(name, i){
                        thisModel.set(name, required[i]);
                    });
                    resolve();
                });
            });
        },
        
        wrap: function(model){
            var thisModel = this;
            if(typeof model === "undefined" || typeof model.has !== "function" || !model.has("type")){
                throw Error("Cannot wrap a non-remote model. Please get model from hub.");
            }
            
            if(!thisModel.has(model.get("type"))){
                throw Error("Cannot wrap model of type: " + model.get("type") + " No such wrapper exists.");
            }else{
                return thisModel.get(model.get("type"))(model);
            }
        }
    });
    
    return Wrapper;
});


