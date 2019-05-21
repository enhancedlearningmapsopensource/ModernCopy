/* global userID, Promise, assertDefined, assert, assertExists, timeNow, hash */

define([
    "require",
    //"jquery",
    "underscore",
    "lzstring",
    "backbone",
    "./save-manager"
], 
function(
    require,
    //$,
    _,
    LzString,
    Backbone,
    SaveManager
){

    var pvt = {
        consts: {
            LOCAL_STORAGE_NAME: "elm-local-store",
            LOCAL_STORAGE_OWNER: "elm-local-owner",
            LOCAL_STORAGE_SET: "elm-local-set",
            MIN_SAVE_DELAY: 2000, // ms,
            SYNC_ERROR: "Error syncing data. Please refresh page. Contact ELM staff if this problem persists."
        }
    };

    var LocalStorageInterface = Backbone.Model.extend({
        defaults:{
            collections: null,  // Backbone.Collection with list of collection models
            lastSaveRequest: null,
            instorage: [] ,
            savestate: null,
            savenow: false
        },
        
        /**
         * Creates empty tables for the given templates
         * @param {Backbone.Model[]} template - the templates
         * @return {Promise}
         */
        createEmptyTables: function(templates){
            var thisModel = this;
            assert($.isArray(templates));
            
            return Promise.all(templates.map(function(template){
                return thisModel.createEmptyTable(template);
            }));
        },
        
        /**
         * Create a new collection from the collection model
         * @param {Backbone.Model} template - the template
         * @return {Promise}
         */
        createEmptyTable: function(template){
            assertDefined(template.get("name"));
            
            var thisModel = this;
            var table = new Backbone.Model({
                id: template.get("name"),
                d: null,
                userid: userID,
                data: new Backbone.Collection()
            });
            
            return new Promise(function(resolve){
                var url = "./automated/" + template.get("name") + "-set";
                require([url], function(Set){
                    // Create the new collection
                    var collection = new Set.Collection();
                    
                    // Save the collection to data
                    table.set("data", collection);
                    
                    // Save the collection record
                    thisModel.get("tables").add(table);
                    
                    resolve();
                });
            });
            
            //collectionModel.get("data").
            
            //throw Error();
        },
        
        initialize: function(options){
            var thisModel = this;
			
            if(typeof sset === "undefined"){
                window.sset = options.set;
            }
            
            // Create collection storage
            thisModel.set("tables", new Backbone.Collection());
        
            // Create the view
            thisModel.set("view", new LocalStorageView({id: "local-storage-view", model: thisModel}));
            
            // Check the owner of the data. If the owner is different than the current user then
            // clear the local storage.
            var owner = null;
            if(localStorage.hasOwnProperty(pvt.consts.LOCAL_STORAGE_OWNER)){
                owner = Number(localStorage[pvt.consts.LOCAL_STORAGE_OWNER]);
                if(userID !== owner){
                    console.log("Owner doesn't match. Owner: " + owner + ", UserID: " + userID);
                    owner = null;
                }
            }else{
                console.log("no owner.");
            }
            
            // Check the set of the data. If the set is different than the current set then
            // clear the local storage.
            var localSet = null;
            if(localStorage.hasOwnProperty(pvt.consts.LOCAL_STORAGE_SET)){
                localSet = localStorage[pvt.consts.LOCAL_STORAGE_SET];
                if(window.sset !== localSet){
                    console.log("Set doesn't match. Saved: " + localSet + ", Current: " + sset);
                    localSet = null;
                }
            }else{
                console.log("no set.");
            }
            
            if(owner === null || localSet === null){
                localStorage.clear();
                localStorage[pvt.consts.LOCAL_STORAGE_OWNER] = userID;
                localStorage[pvt.consts.LOCAL_STORAGE_SET] = window.sset;
            }
        },
        
        /**
         * Check to see if the collection exists
         * @param {string} name - collection name
         * @return {boolean} - true if the collection exists, otherwise false
         */
        hasTable: function(name){
            var thisModel = this;
            return (thisModel.get("tables").has(name));
        },
        
        /**
         * Preload the required set files
         * @param {string[]} setnames - names of the sets to load
         */
        preloadSets:function(setnames){
            var thisModel = this;
            
            /*var paths = setnames.map(function(name){
                return "./automated/" + name + "-set";
            });*/
            
            return Promise.all(setnames.map(function(name){
                var path = "./automated/" + name + "-set";
            
                return new Promise(function(resolve){
                    require([path],function(Set){
                        thisModel.get("sets").add({id: name, set: Set});
                        resolve();
                    });
                });
            }));
        },
        
        
        
        saveChanges: function(){
            var thisModel = this;
            var time = new Date().getTime();
            thisModel.set("lastSaveRequest", time);
            thisModel.set("savestate", null);

            const saveDelay = (thisModel.get("savenow") === false) ? pvt.consts.MIN_SAVE_DELAY : 200;
            /*if(thisModel.get("savenow") === false){
                setTimeout(function(){ 
                    if(thisModel.get("lastSaveRequest") === time){
                        pvt.saveData.call(thisModel);
                    }
                }, pvt.consts.MIN_SAVE_DELAY);
            }else{
                pvt.saveData.call(thisModel);
            }*/
            setTimeout(function(){ 
                if(thisModel.get("lastSaveRequest") === time){
                    pvt.saveData.call(thisModel);
                }
            }, saveDelay);
        },
        
        /**
         * Updates the currently selected set in the local storage
         * @return {undefined}
         */
        selectSet: function(set, hub){
            // Get current set
            var localSet = null;
            if(localStorage.hasOwnProperty(pvt.consts.LOCAL_STORAGE_SET)){
                localSet = localStorage[pvt.consts.LOCAL_STORAGE_SET];
            }
            
            // If the set has changed then update local storage and recover the data
            if(localSet !== set){
                console.log("changing set to: " + set);
                localStorage[pvt.consts.LOCAL_STORAGE_SET] = set;
                return Promise.all([
                    hub.get("map").fetch(),
                    hub.get("mapnode").fetch(),
                    hub.get("node").fetch(),
                    hub.get("mapresource").fetch(),
                    hub.get("nodetostandard").fetch(),
                    hub.get("simplestandard").fetch(),
                    hub.get("resource").fetch(),
                    hub.get("edge").fetch()
                ]);
            }else{
                return Promise.resolve();
            }
        },
        
        /**
         * Precongure the local storage by creating tables for each collection
         * @param {type} server
         * @return {Promise}
         */
        preconfigure: function(server){
            var thisModel = this;
            
            // Get all table templates as an array
            var tableTemplates = server.get("tableTemplates").map(function(d){return d;});
            assertExists(tableTemplates); 
            //assert($.isArray(tableTemplates));
            
            // Check for missing tables
            var missing = pvt.identifyMissingTables.call(thisModel, tableTemplates);
            
            // Create empty tables for any missing
            try{
                return thisModel.createEmptyTables(missing);
            }catch(err){
                localStorage.clear();
                window.hub.sendUserNotification(pvt.consts.SYNC_ERROR);
                throw Error("Error while creating table." + err.message);
            }
        },
        
        /**
         * Sync to the server
         * @param server - the server
         * @param hub - the hub object
         * @param {string[]=[]} trustlocal - tables listed here will only be recovered if they don't exist. Otherwise the local version will be used regardless of whether it is in sync.
         * @param {function=undefined} error - optional function to call in the event of an error.
         * return {Promise}
         */
        syncWithServer: function(server, hub, trustlocal, error){
            var thisModel = this;
            trustlocal = (typeof trustlocal === "undefined") ? [] : trustlocal;
            
            // Get all table templates as an array
            var tableTemplates = server.get("tableTemplates").map(function(d){return d;});
            assertExists(tableTemplates); 
            //assert($.isArray(tableTemplates));
            
            // Preload the table definitions (without filling the tables)
            var st = timeNow();
            pvt.loadData.call(thisModel);
            if(typeof times !== "undefined"){
                times.push({
                    name: "local-storage.loadData",
                    time: timeNow() - st
                });
            }

            // Find any table that is out of sync
            st = timeNow();
            var unSynced = pvt.identifyUnsyncedTables.call(thisModel, tableTemplates);
            if(typeof times !== "undefined"){
                times.push({
                    name: "local-storage.identifyUnsyncedTables",
                    time: timeNow() - st
                });
            }

            // Check each table and compare to the list of trusted tables
            if(trustlocal.length > 0){
                let untrustedUnsynced = [];
                unSynced.forEach(function(template){
                    // Check the elements in the table.
                    const table = thisModel.get("tables").get(template.get("name"));
                    if(table.get("data").length === 0){
                        // Table is empty so we need to sync it even if it is trusted.
                        untrustedUnsynced.push(template);
                        return;
                    }

                    // Check to see if the table is trusted
                    const isTrusted = typeof trustlocal.find(function(d){
                        return d === template.get("name");
                    }) !== "undefined";

                    // Table is not trusted so request sync.
                    if(!isTrusted){
                        untrustedUnsynced.push(template);
                    }
                });
                unSynced = untrustedUnsynced;
                //
        
                // Remove items one at a time until the table is empty
                //while(table.get("data").length > 0){
            }
            
            // Record number to sync
            var numToSync = unSynced.length;
            
            // Keep track of number synced
            var numSynced = 0;
            
            return Promise.all(unSynced.map(function(template){
                return Promise.resolve().then(_.bind(pvt.syncTable, thisModel, template, error)).then(function(){
                    numSynced++;
                    if(typeof window.hub !== "undefined"){
                        window.hub.sendUserNotification("Loading data: (" + (numToSync-numSynced) + "/" + numToSync + " remaining)");
                        window.hub.sendLogNotification("Loaded Table: " + template.get("name"));
                    }
                    return true;
                }).catch(function(err){
                    if(typeof error === "function"){
                        error(err);
                    }
                    numSynced++;
                    console.warn(err);
                    return false;
                });
            })).then(function(results){
                // Check to see if any of the sync operations failed.
                var passed = results.reduce(function(acc,val){
                    return acc && val;
                }, true);
                
                // If any failed then notify the user.
                if(!passed && typeof window.hub !== "undefined"){
                    window.hub.sendUserNotification(pvt.consts.SYNC_ERROR);
                }
                return passed;
            });

            // Create a list of functions that produce promises
            /*var promiseFunctions = unSynced.map(function(template){
                return function(){                
                    return pvt.syncTable.call(thisModel, template).then(function(){
                        numSynced++;
                        hub.sendUserNotification("Loading data: (" + (numToSync-numSynced) + "/" + numToSync + " remaining)");
                    });
                };
            });
            
            return sequencePromises(promiseFunctions).catch(function(err){
                localStorage.clear();
                hub.sendUserNotification(pvt.consts.SYNC_ERROR);
                //hub.sendUserNotification("Error syncing data. Local storage has been reset. Please refresh page. Contact ELM staff if this problem persists.");
                //var url = table.get("data").url();
                throw Error("Error while trying to sync template." + err.message);
            });
            //return Promise.all();*/
        }
    });
    
    pvt.hash = function(str){
        /*var hash = 0, i, chr;
        if (str.length === 0) return hash;
        for (i = 0; i < str.length; i++) {
            chr   = str.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;*/
        return hash(str);
    };
    
    /**
     * Load data from local storage into the tables
     * @param {bool = true} loadTableData - if false the data is not loaded into the collections but is housed in a temp field
     */
    pvt.loadData = function(loadTableData){
        var thisModel = this;
        loadTableData = (typeof loadTableData === "undefined" || loadTableData === null) ? true : loadTableData;
        
        // Get tables
        //var tables = thisModel.get("tables");
        
        if(localStorage.hasOwnProperty(pvt.consts.LOCAL_STORAGE_NAME)){
            // Decompress browser data
            var st = timeNow();
            var compressed = localStorage[pvt.consts.LOCAL_STORAGE_NAME];
            var raw = LzString.decompress(compressed);
            if(typeof window.times !== "undefined"){
                window.times.push({
                    name: "decompress",
                    time: timeNow() - st
                });
            }
            
            if(raw !== null){
                
                /**
                 * List of flattened tables
                 * @type {FlattenedTable[]}
                 */
                let flattened = null;
                try{
                    flattened = JSON.parse(raw);
                }catch(ex){
                    localStorage.clear();
                    throw Error("Failed to parse: " + raw);
                }
            
                // Filter out flattened tables that belong to other users
                flattened = flattened.filter(function(collection){
                    return (collection.userid === userID);
                });
                
                // Load the data into the newly created tables
                st = timeNow();
                flattened.forEach(function(flat){
                    if(thisModel.get("tables").has(flat.id)){
                        var table = thisModel.get("tables").get(flat.id);
                        
                        var storageRecord = thisModel.get("instorage").find(function(s){return (s.id === flat.id);});
                        if(!storageRecord){
                            thisModel.get("instorage").push({
                                id: flat.id,
                                hash: pvt.hash(JSON.stringify(flat.data))
                            });
                        }else{
                            storageRecord.hash = pvt.hash(raw);
                        }

                        if(loadTableData){
                            table.get("data").add(flat.data, {merge:true});
                        }
                        table.set("d", flat.d);
                    }else{
                        // The table is no longer being used - rare but it happens
                    }
                });
                if(typeof times !== "undefined"){
                    window.times.push({
                        name: "inflate",
                        time: timeNow() - st
                    });
                }
                
            }
        }
    };
    
    /**
     * Determine which of the given templates does not have a matching table
     * @param {TableTemplate[]} tableTemplates - templates to check
     * @return {TableTemplate[]} - missing tables
     */
    pvt.identifyMissingTables = function(tableTemplates){
        var thisModel = this;
        
        assertExists(tableTemplates);
        //assert($.isArray(tableTemplates));
        
        return tableTemplates.filter(function(tableTemplate){
            return !thisModel.hasTable(tableTemplate);
        });
    };
    
    /**
     * Determine which of the given templates has a table that is out of sync
     * @param {TableTemplate[]} tableTemplates - templates to check
     * @return {TableTemplate[]} - out of sync tables
     */
    pvt.identifyUnsyncedTables = function(tableTemplates){
        var thisModel = this;
        
        // Get tables
        var tableList = thisModel.get("tables");
        
        return tableTemplates.filter(function(template){
            var name = template.get("name");
            var table = tableList.get(name);
            assertExists(table);
            
            // Compare d to date and keep any that DO NOT match
            return (table.get("d") !== template.get("date"));
        });
    };
    
    /**
     * Save current data to local storage
     * This process takes a lot of time so we break it apart and do it over a longer interval. If at any point
     * another save request comes in, the save object will be destroyed so the current save will simply stop.
     * @return {undefined}
     */
    pvt.saveData = function(){
        var thisModel = this;
        if(typeof window.hub !== "undefined"){
            window.hub.sendLogNotification("saving data.");
        }
        thisModel.set("savestate", {});
        SaveManager.save(thisModel, pvt.consts.LOCAL_STORAGE_NAME);
    };
    
    /**
     * Sync the table associated to the given template
     * @param {TableTemplate} template - the table template
     * @param {function=undefined} error - optional function to call in the event of an error.
     * @return Promise
     */
    pvt.syncTable = function(template, error){
        var thisModel = this;
        
        // Get the table
        var table = thisModel.get("tables").get(template.get("name"));
        
        // Remove items one at a time until the table is empty
        while(table.get("data").length > 0){
            table.get("data").reset();//remove(table.get("data").at(0));
        }

        // Fetch the data  
        return table.get("data").fetch().then(function(){
            // Sync the date
            table.set("d", template.get("date"));
        }).catch(function(err){
            if(typeof error === "function"){
                error(err);
            }
            console.warn("Error while trying to sync template: " + template.get("name") + err.response.responseText);
            throw Error("Error while trying to sync template: " + template.get("name") + err.response.responseText);
        });
    };
    
    //===================================================================================
    //===================================================================================
    
    /**
     * Local Storage View for monitoring changes in the model
     * @type {type}
     */
    var LocalStorageView = Backbone.View.extend({
        
        saveChanges: function(){
            var thisView = this;
            thisView.model.saveChanges();
        },
        
        addCollection: function(model){
            var thisView = this;
            thisView.listenTo(model.get("data"), "update", thisView.saveChanges);
        },
    
        initialize: function(){
            var thisView = this;
            var model = thisView.model;
            
            thisView.listenTo(model.get("tables"), "add", thisView.addCollection);
        }
    });
    
    
    
    return LocalStorageInterface;
});

