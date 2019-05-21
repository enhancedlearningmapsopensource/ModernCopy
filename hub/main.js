/* global Promise, assert, assertExists */

/**
 * Implements Data interface for backwards compatibility with the roster system
 */

define([
    "underscore",
    "backbone",
    "./server-model",
    "./test-server-model",
    "./local-storage",
    "./wrapper-model",
    "./searcher-model"], 
function(
    _,
    Backbone,
    ServerModel,
    TestServerModel,
    LocalStorageInterface,
    WrapperModel,
    SearcherModel
){


    var pvt = {
        datahub: null
    };
    
    /**
     * The Hub
     * @type {Backbone.Model}
     */
    var Hub = Backbone.Model.extend({
        defaults: {
            "server": null, // Server model
            "local": null, // Local model
            "wrappers": null,
            "searchers": null,
            "loaded": false,
            "loading": false
        },      
        
        addHtml(str){
            if(typeof str !== "string"){
                return str;
            }
            if(str === null || typeof str === "undefined"){
                return null;
            }
            return str
                .replaceAll("\n", "&#32")
                .replaceAll(" ", "&#32;")
                .replaceAll("!", "&#33;")
                .replaceAll("\"", "&#34;")
                .replaceAll("$", "&#36;")
                .replaceAll("%", "&#37;")
                .replaceAll("'", "&#39;")
                .replaceAll("(", "&#40;")
                .replaceAll(")", "&#41;")
                .replaceAll("+", "&#43;")
                .replaceAll(",", "&#44;")
                .replaceAll("-", "&#45;")
                .replaceAll(".", "&#46;")
                .replaceAll("/", "&#47;")
                .replaceAll(":", "&#58;")
                .replaceAll("<", "&#60;")
                .replaceAll("=", "&#61;")
                .replaceAll(">", "&#62;")
                .replaceAll("?", "&#63;")
                .replaceAll("@", "&#64;")
                .replaceAll("[", "&#91;")
                .replaceAll("\\", "&#92;")
                .replaceAll("]", "&#93;")
                .replaceAll("_", "&#95;")
                .replaceAll("{", "&#123;")
                .replaceAll("|", "&#124;")
                .replaceAll("}", "&#125;");
        },
        
        /**
         * Get the collection with the given name otherwise apply as normal to the hub model
         * @param {string} attributes - collection name
         */
        get: function(attributes, options){
            var thisModel = this;
            if(attributes !== null && typeof attributes === "string"){
                if(thisModel.attributes.hasOwnProperty(attributes)){
                    return thisModel.attributes[attributes];
                }
                
                var local = thisModel.get("local");
                if(local.hasTable(attributes)){
                    
                    // get("user")
                    if(!options){
                        return local.get("tables").get(attributes).get("data");
                    }
                    
                    // get("user",1);
                    else{
                        if(!$.isArray(options)){
                            options = [options];
                        }
                        return thisModel.getModels(attributes, options).map(function(d){
                            return {
                                model: d
                            };
                        });
                    }
                }
            }
            return null;
        },
        
        /**
         * 
         * @param {type} collection
         * @param {type} modelIDs
         * @return {unresolved}
         */
        getModels: function(collection, modelIDs){
            var thisModel = this;
            var table = thisModel.get(collection);
            return modelIDs.map(function(id){
                return table.get(id);
            });
        },
        
        /**
         * Get the models matching the given conditions in the given collection
         * @param {string} collection - collection to get models from
         * @param {object} conditions - used in a backbone where operation
         * @return {Backbone.Model[]} - models matching the given conditions in the given collection
         */
        getWhere(collection, conditions){
            var thisModel = this;
            return thisModel.get(collection).where(conditions);
        },
        
        
        
        /**
         * Lays out the groundwork for listeners
         * @param {object} options
         * @param {boolean} options.savenow - (default: false) whether to save data to local storage immediately or over time.
         * @return {Promise}
         */
        preconfigure: function(options){
            var thisModel = this;
            var logLines = [];
            
            logLines.push("-------------------------------------------");
            logLines.push("Preconfiguring Hub");
            logLines.push("");
            
            /**
             * Preconditions
             * - Local storage does not exist
             */
            assert(thisModel.get("local") === null);
            
            // Initialize/Reinitialize local
            thisModel.set("local", new LocalStorageInterface(options));
            if(options && options.hasOwnProperty("savenow") && options.savenow === true){
                thisModel.get("local").set("savenow", true);
            }
            
            logLines.push("Local Storage: " + localStorage.length);
            
            var server = thisModel.get("server");
            var local = thisModel.get("local");
            
            // Get server status
            return server.fetch().then(function(/*ret*/){
                // Define time zero
                thisModel.TIME_ZERO = server.get("timezero");

                // Create space to house templates
                if(!server.has("tableTemplates")){
                    server.set("tableTemplates", new Backbone.Collection());
                }
                
                logLines.push("Database: " + server.get("database"));
                
                // Load wrappers
                var wrappers = server.get("wrappers");
                thisModel.set("wrappers", new WrapperModel({
                    id: "wrapper-model",
                    wrappers: wrappers
                }));
                return thisModel.get("wrappers").preconfigure();
            }).then(function(){
                // Load searchers
                var searchers = server.get("searchers");
                thisModel.set("searchers", new SearcherModel({
                    id: "wrapper-model",
                    searchers: searchers
                }));
                return thisModel.get("searchers").preconfigure();
            }).then(function(){
                
                // Move from tables structure to the collections
                server.get("tableTemplates").add(server.get("tables"), {merge: true});

                // Sync local and server
                return local.preconfigure(server);
            }).then(function(){
                logLines.push("-------------------------------------------");
                console.log(logLines.join("\n"));
            });
        }, 
        
        /**
         * Reloads the hub, refreshing the data. 
         * @param {string[]=[]} trustlocal - tables listed here will only be recovered if they don't exist. Otherwise the local version will be used regardless of whether it is in sync.
         * @param {function=undefined} error - optional function to call in the event of an error.
         * @return {Promise}
         */
        reload: function(trustlocal, error){
            var thisModel = this;
            trustlocal = (typeof trustlocal === "undefined") ? [] : trustlocal;
            
            thisModel.sendUserNotification("Loading data.");
            
            /**
             * Preconditions
             * - Local storage exists and contains tables for collections
             */
            assertExists(thisModel.get("local"));
            assert(thisModel.get("local").get("tables").length > 0);
            
            var server = thisModel.get("server");
            var local = thisModel.get("local");

            // Sync local and server
            return local.syncWithServer(server, thisModel, trustlocal, error).then(function(passed){
                if(passed){
                    thisModel.set("loaded", true);
                }
                return Promise.resolve(passed);
            });
        },
        
        /**
         * Search for the given id with the given searcher
         * @param {type} id
         * @return {unresolved}
         */
        search(name, id){
            var thisModel = this;
            return thisModel.get("searchers").search(name, id);
        },
        
        /**
         * Updates the currently selected set and loads the required data.
         * @param {string} set - the new set
         * @return {Promise}
         */
        selectSet(set){
            var thisModel = this;
            return thisModel.get("local").selectSet(set, thisModel);
        },
        
        /**
         * Send a notification to the user. This works best of the window.notifyUser function is defined
         * ouside the hub. If no function is defined then the notification is sent via the console.
         * @param {string} str - the text to send to the user.
         */
        sendUserNotification: function(str){
            if(typeof window.notifyUser === 'function'){
                window.notifyUser(str);
            }else{
                console.log("Notify User: '" + str + "'");
            }
        },

        /**
         * Send a notification to the user. This works best of the window.notifyUser function is defined
         * ouside the hub. If no function is defined then the notification is sent via the console.
         * @param {string} str - the text to send to the user.
         */
        sendLogNotification: function(str){
            if(typeof window.logNotification === 'function'){
                window.logNotification(str);
            }else{
                console.log("HubLog: '" + str + "'");
            }
        },
        
        /**
         * Strip html entities added by database on upload.
         * @param {string} htmlString - string to clean
         * @return {string} - string cleaned of html entities
         */
        stripHtml(htmlString){
            if(typeof htmlString !== "string"){
                return htmlString;
            }
            if(htmlString === null || typeof htmlString === 'undefined'){
                return null;
            }
            return htmlString
                .replaceAll("&nbsp;", " ")
                .replaceAll("&#32;", " ")
                .replaceAll("&#33;", "!")
                .replaceAll("&#34;", "\"")
                .replaceAll("&#36;", "$")
                .replaceAll("&#37;", "%")
                .replaceAll("&#39;", "'")
                .replaceAll("&#40;", "(")
                .replaceAll("&#41;", ")")
                .replaceAll("&#43;", "+")
                .replaceAll("&#44;", ",")
                .replaceAll("&#45;", "-")
                .replaceAll("&#46;", ".")
                .replaceAll("&#47;", "/")
                .replaceAll("&#58;", ":")
                .replaceAll("&#60;", "<")
                .replaceAll("&#61;", "=")
                .replaceAll("&#62;", ">")
                .replaceAll("&#63;", "?")
                .replaceAll("&#64;", "@")
                .replaceAll("&#91;", "[")
                .replaceAll("&#92;", "\\")
                .replaceAll("&#93;", "]")
                .replaceAll("&#95;", "_")
                .replaceAll("&#123;", "{")
                .replaceAll("&#124;", "|")
                .replaceAll("&#125;", "}")
                .replaceAll("%3F", "?");
        },
        
        wrap(model){
            var thisModel = this;
            return thisModel.get("wrappers").wrap(model);
        },
        
        /**
         * Test the server by using a model to send REST requests which return predictable responses.
         * @return {Promise.Object} - report on server capabilities
         */
        testServer: function(){
            var thisModel = this;
            
            // Set up the test results
            var testResults = {};
            
            // =================================
            // == Test POST Functionality
            // =================================
            // model.save(attributes, options)
            // - attributes: to change 
            //
            // model.save(attributes, {patch,true})
            // - only send given attributes to server
            var server = new TestServerModel();
            
            return server.save({testattra: "test-attr-a"})
            .then(function(a,b,c,d){
                if(server.has("testattra") && server.get("testattra") === "test-attr-a" && server.get("method") === "POST"){
                    testResults.post = true;
                }else{
                    testResults.post = false;
                }
                return Promise.resolve();
            }).catch(function(a,b,c){
                testResults.post = false;
                return Promise.resolve();
            })
            
            // =================================
            // == Test PUT Functionality
            // =================================
            .then(function(a,b,c){
                // Set the id so that it becomes a saved model
                server.set("id", "server-id"); 
                
                // Send to server
                return server.save({testattrb: "test-attr-b"});
            })
            .then(function(a,b,c,d){
                if(server.has("testattrb") && server.get("testattrb") === "test-attr-b" && server.get("method") === "PUT"){
                    testResults.put = true;
                }else{
                    testResults.put = false;
                }
                return Promise.resolve();
            })      
            .catch(function(a,b,c){
                testResults.put = false;
                return Promise.resolve();
            })
            
            // =================================
            // == Test GET Functionality
            // =================================
            .then(function(a,b,c,d){
                // Clear the model 
                server = new TestServerModel();
                
                // Fetch data
                return server.fetch();
            })
            .then(function(a,b,c,d){
                if(server.get("method") === "GET"){
                    testResults.get = true;
                }else{
                    testResults.get = false;
                }
                return Promise.resolve();
            })
            .catch(function(a,b,c){
                testResults.get = false;
                return Promise.resolve();
            })
            
            // =================================
            // == Test DESTROY Functionality
            // =================================
            .then(function(ret){
                // Destroy model
                server.set("id", "server-id");
                return server.destroy();
            })
            .then(function(ret){
                testResults.delete = false;
                return Promise.resolve();
            })
            .catch(function(ret){
                if(ret.response.responseText === "METHOD:DELETE"){
                    testResults.delete = true;
                }
                return Promise.resolve();
            })
            .then(function(){
                return testResults;
            });
        }
    });
    
    
    
    var HubView = Backbone.View.extend({
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            
            // Connect to the data hub
            thisView.model = pvt.datahub;
            pvt.datahub.set("view", thisView);
            
        },

        /**
         * Render the view
         */
        render:function(){
            var thisView   = this;
            
        }
    });
    
    // Ensure singleton
    if(pvt.datahub === null){
        pvt.datahub = new Hub({
            id: "hub",
            "server": new ServerModel(),
            "local": null,
        });
        pvt.datahub.set("view", new HubView({id: 'hub-view', model: this}));
    }
    
    return pvt.datahub;
});


