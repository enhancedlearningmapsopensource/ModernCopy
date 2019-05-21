define(["backbone"], function(Backbone){
    /*Backbone.sync = function(method, model, options){
        var url = model.url();
        var req =  req);
        $.post(model.url, )
        throw Error();
    };*/
    
    var Remote = {
    
        Model: Backbone.Model.extend({
        
            /**
             * Destroy the model on the database
             * @param {Object} options
             * @return {Promise}
             */
            destroy: function(options){
                var thisModel = this;

                // Check that options exist
                options = (typeof options === "undefined" || options === null) ? {} : options;

                // Make sure success/error functions are not present
                assert(!options.hasOwnProperty("success"));
                assert(!options.hasOwnProperty("error"));

                return new Promise(function(resolve, reject){
                    // Set up the success function
                    options.success = function(a,b,c){
                        resolve(a,b,c);
                    };

                    // Set up the error function
                    options.error = function(model,response,c){
                        reject({
                            model: model,
                            response: response
                        });
                    };

                    // Apply the save
                    Backbone.Model.prototype.destroy.call(thisModel, options);
                });
            },

            /**
             * Fetch the model data from the database
             * @param {Object} options
             * @return {Promise}
             */
            fetch: function(options){
                var thisModel = this;

                // Check that options exist
                options = (typeof options === "undefined" || options === null) ? {} : options;

                // Make sure success/error functions are not present
                assert(!options.hasOwnProperty("success"));
                assert(!options.hasOwnProperty("error"));

                return new Promise(function(resolve, reject){
                    // Set up the success function
                    options.success = function(a,b,c){
                        resolve(a);
                    };

                    // Set up the error function
                    options.error = function(model,response,c){
                        reject({
                            model: model,
                            response: response
                        });
                    };

                    // Apply the fetch
                    Backbone.Model.prototype.fetch.call(thisModel, options);
                });
            },

            /**
             * Save model to database. If the model exists then sends a PUT request otherwise
             * sends a POST request. All model attributes are passed to the server. Use options 
             * {patch: true} to only send the given attributes to the server.
             * 
             * Example:
             * 
             * // Normal save operation (PUT - Send all model attributes)
             * model.save()
             * 
             * // Patch save operation (PATCH - Send given attributes)
             * model.save(model.attributes, {patch: true})
             * 
             * @param {Object} attributes - the attributes that were changed. 
             * @param {Object} options
             * @param {boolean} options.patch - true if you only want to pass the given attribute to the server, otherwise all model attributes are passed.
             * @return {Promise}
             */
            save: function(attributes, options){
                var thisModel = this;

                // Check that options exist
                options = (typeof options === "undefined" || options === null) ? {} : options;

                // Make sure success/error functions are not present
                if(options.hasOwnProperty("success")){
                    options.callerSuccess = options.success;
                    options.success = null;
                }
                if(options.hasOwnProperty("error")){
                    options.callerError = options.error;
                    options.error = null;
                }

                return new Promise(function(resolve, reject){
                    // Set up the success function
                    options.success = function(a,b,c){
                        if(options.hasOwnProperty("callerSuccess")){
                            options.callerSuccess(a,b,c);
                        }
                        resolve(a);
                    };

                    // Set up the error function
                    options.error = function(model,response,c){
                        if(options.hasOwnProperty("callerError")){
                            options.callerError(model,response,c);
                        }
                        
                        reject({
                            model: model,
                            response: response
                        });
                    };

                    // Apply the save
                    Backbone.Model.prototype.save.call(thisModel, attributes, options);
                });
            }
        }),
        
        Collection: Backbone.Collection.extend({
            create: function(attributes, options){
                var thisModel = this;

                // Check that options exist
                options = (typeof options === "undefined" || options === null) ? {} : options;

                // Make sure success/error functions are not present
                if(options.hasOwnProperty("success")){
                    options.callerSuccess = options.success;
                    options.success = null;
                }
                if(options.hasOwnProperty("error")){
                    options.callerError = options.error;
                    options.error = null;
                }

                return new Promise(function(resolve, reject){
                    // Set up the success function
                    options.success = function(a,b,c){
                        if(options.hasOwnProperty("callerSuccess")){
                            options.callerSuccess(a,b,c);
                        }
                        resolve(a);
                    };

                    // Set up the error function
                    options.error = function(model,response,c){
                        if(options.hasOwnProperty("callerError")){
                            options.callerError(model,response,c);
                        }
                        
                        reject({
                            model: model,
                            response: response
                        });
                    };

                    // Apply the save
                    Backbone.Collection.prototype.create.call(thisModel, attributes, options);
                });
            },
            
            destroyModels: function(attributes, options){
                // Compatibility function 
                throw Error("Deprecated 12/12/2017");
            },
            
            /**
             * Fetch the model data from the database
             * @param {Object} options
             * @return {Promise}
             */
            fetch: function(options){
                var thisCollection = this;

                // Check that options exist
                options = (typeof options === "undefined" || options === null) ? {} : options;

                // Make sure success/error functions are not present
                assert(!options.hasOwnProperty("success"));
                assert(!options.hasOwnProperty("error"));

                return new Promise(function(resolve, reject){
                    // Set up the success function
                    options.success = function(ret,b,c){
                        resolve(ret);
                    };

                    // Set up the error function
                    options.error = function(model,response,c){
                        reject({
                            model: model,
                            response: response
                        });
                    };

                    // Apply the save
                    Backbone.Collection.prototype.fetch.call(thisCollection, options);
                });
            },
            
            /**
             * Just like where, but directly returns only the first model in the collection that matches the passed attributes.
             * 
             * Searches first for a match with the given attributes. If that fails to produce results then it adds html tags
             * and searches again. If that fails then it strips the html tags and tries once more.
             * 
             * @param {object} attributes - the model to return has these attributes.
             */
            findWhere: function(attributes, Hub){
                var thisCollection = this;
                if(Hub){
                    // Perform the normal search
                    var result = Backbone.Collection.prototype.findWhere.call(thisCollection, attributes);
                    if(typeof result !== "undefined"){
                        return result;
                    }

                    // Wrap each attribute value in html tags
                    var htmlAttributes = Object.keys(attributes).reduce(function(acc, key){
                        acc[key] = Hub.addHtml(attributes[key]);
                        return acc;
                    }, {});

                    // Perform second search
                    result = Backbone.Collection.prototype.findWhere.call(thisCollection, htmlAttributes);
                    if(typeof result !== "undefined"){
                        return result;
                    }

                    // Strip html and try again 
                    var strippedAttributes = Object.keys(attributes).reduce(function(acc, key){
                        acc[key] = Hub.stripHtml(attributes[key]);
                        return acc;
                    }, {});
                    return Backbone.Collection.prototype.findWhere.call(thisCollection, htmlAttributes);
                }else if(typeof hub !== "undefined"){
                    return thisCollection.findWhere(attributes, hub);
                }else{
                    return Backbone.Collection.prototype.findWhere.call(thisCollection, attributes);;
                }
            },
            
            /**
             * Find models in the collection that match the given conditions.
             * 
             * Searches first for a match with the given attributes. If that fails to produce results then it adds html tags
             * and searches again. If that fails then it strips the html tags and tries once more.
             * 
             * @param {object} attributes - the model to return has these attributes.
             */
            where: function(attributes, first, Hub){
                var thisCollection = this;
                if(Hub){
                    // Perform the normal search
                    var result = Backbone.Collection.prototype.where.call(thisCollection, attributes, first);
                    if(typeof result !== "undefined"){
                        if(first === true){
                            return result;
                        }else if(result.length > 0){
                            return result;
                        }
                    }

                    // Wrap each attribute value in html tags
                    var htmlAttributes = Object.keys(attributes).reduce(function(acc, key){
                        acc[key] = Hub.addHtml(attributes[key]);
                        return acc;
                    }, {});

                    // Perform second search
                    result = Backbone.Collection.prototype.where.call(thisCollection, htmlAttributes, first);
                    if(typeof result !== "undefined"){
                        if(first === true){
                            return result;
                        }else if(result.length > 0){
                            return result;
                        }
                    }

                    // Strip html and try again 
                    var strippedAttributes = Object.keys(attributes).reduce(function(acc, key){
                        acc[key] = Hub.stripHtml(attributes[key]);
                        return acc;
                    }, {});
                    return Backbone.Collection.prototype.where.call(thisCollection, htmlAttributes, first);
                }else if(typeof hub !== "undefined"){
                    return thisCollection.where(attributes, first, hub);
                }else{
                    return Backbone.Collection.prototype.where.call(thisCollection, attributes, first);;
                }
            }
        })
    };
    
    // ===================================================================
    // Export function to allow the object to be extended
    // ===================================================================
    Remote.Model.extend = function (child) {
        var ex = Backbone.Model.extend.apply(this, arguments);
        ex.prototype.events = _.extend({}, this.prototype.events, child.events);
        return ex;
    };
    
    Remote.Collection.extend = function (child) {
        var ex = Backbone.Collection.extend.apply(this, arguments);
        ex.prototype.events = _.extend({}, this.prototype.events, child.events);
        return ex;
    };
    
    return Remote;
});
