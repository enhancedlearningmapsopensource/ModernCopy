define(["require","lzstring", "timing"], function(require, LzString, CreateTimer){
    var smt = {};
    CreateTimer(smt);
    
    class SaveManager{
        static save(model, storageName){
            var thisClass = this;
            if(model.get("savestate") === null){
                return;
            }else if(Object.keys(model.get("savestate")).length === 0){
                model.set("savestate", {
                    savable: [],
                    toProcess: model.get("tables").map(function(d){return d;}),
                    packaged: [],
                    hashed: [],
                    alreadySaved: []
                });
            }else{
                var savestate = model.get("savestate");
                // Package the tables
                if(savestate.toProcess.length > 0){
                    // Get table
                    var table = savestate.toProcess.shift();
                    
                    
                    var packaged = thisClass.packageTable(table);
                    savestate.packaged.push(packaged);
                }
                // Hash the data
                else if(savestate.packaged.length > 0){
                    smt.startsub("save-manger.save package time.");
                    var packaged = savestate.packaged.shift();
                    smt.startsub("save-manger.save {"+packaged.id+"} package time.");
                    if(packaged.models.length > 0){
                        // Pack a data point
                        for(var i = 0; (i < 10 && packaged.models.length > 0); i++){
                            thisClass.packageData(packaged);
                        }
                        
                        // Replace the package in the array
                        savestate.packaged.unshift(packaged);
                    }else{
                        savestate.hashed.push({
                            package: packaged,
                            hash: thisClass.hash(JSON.stringify(packaged.data))
                        });
                    }
                    smt.stopsub("save-manger.save {"+packaged.id+"} package time.");
                    smt.stopsub("save-manger.save package time.");
                }
                
                else if(savestate.hashed.length > 0){
                    smt.startsub("save-manger.save hash time.");
                    var hashed = savestate.hashed.shift();
                    
                    // Find the storage record
                    var storageRecord = model.get("instorage").find(function(d){
                        return d.id === hashed.package.id;
                    });
                    
                    if(!storageRecord || storageRecord.hash !== hashed.hash){
                        savestate.savable.push(hashed.package);
                        if(!storageRecord){
                            model.get("instorage").push({
                                id: hashed.package.id,
                                hash: hashed.hash
                            });
                        }else{
                            storageRecord.hash = hashed.hash;
                        }
                    }else{
                        savestate.alreadySaved.push(hashed.package);
                    }
                    smt.stopsub("save-manger.save hash time.");
                }
                
                
                else if(savestate.savable.length > 0){
                    
                    if(savestate.alreadySaved.length > 0){
                        var s = timeNow();
                        savestate.savable = savestate.savable.concat(savestate.alreadySaved);
                        savestate.alreadySaved = [];
                        
                        var cost = timeNow() - s
                        if(cost > 1000){
                            console.warn("Concat took a long time. Time: " + cost);
                        }
                    }else{
                        
                        if (typeof(Worker) !== "undefined") {
                            // Web worker is supported
                            if (typeof(window.compressWorker) === "undefined") {
                                console.log("Starting local storage compression.");
                                var path = require.toUrl("./workers/compress-worker.js");
                                window.compressWorker = new Worker(path);
                                window.compressWorker.onmessage = function(event){
                                    console.log("ending compression");
                                    
                                    smt.startsub("store time");
                                    localStorage[storageName] = event.data;
                                    smt.stopsub("store time");

                                    console.log("save manager timing report: ");
                                    console.log(smt.print());
                                    window.compressWorker.terminate();
                                    window.compressWorker = undefined;
                                };
                                window.compressWorker.onerror = function(){
                                    throw Error("Error in worker");
                                };
                                window.compressWorker.postMessage(JSON.stringify(savestate.savable));
                            }
                        } else {
                            smt.startsub("compress time");
                            var raw = JSON.stringify(savestate.savable);
                            var compressed = LzString.compress(raw);
                            smt.stopsub("compress time");
                            
                            smt.startsub("store time");
                            localStorage[storageName] = compressed;
                            smt.stopsub("store time");

                            console.log("save manager timing report: ");
                            console.log(smt.print());
                        }
                        return;
                    }
                }
                
                else{
                    console.log("save manager timing report: ");
                    console.log(smt.print());
                    return;
                }
            }
            
            setTimeout(function(){thisClass.save(model, storageName);}, 1);
        }
        
        static oldSave(model, storageName){
            
            
            // Stringify each collection
            var alreadySaved = [];
            var savable = model.get("tables").reduce(function(acc, collection){
                var packaged = {
                    userid: collection.get("userid"),
                    id: collection.id,
                    d: collection.get("d"),
                    data: collection.get("data").reduce(function(dataAcc, model){
                        return dataAcc.concat([model.attributes]);
                    }, [])
                };

                var hash = thisClass.hash(JSON.stringify(packaged.data));
                var storageRecord = model.get("instorage").find(function(d){return d.id === collection.id});
                if(!storageRecord || storageRecord.hash !== hash){
                    acc = acc.concat([packaged]);
                    if(!storageRecord){
                        model.get("instorage").push({
                            id: collection.id,
                            hash: hash
                        });
                    }else{
                        storageRecord.hash = hash;
                    }
                }else{
                    alreadySaved = alreadySaved.concat([packaged]);
                }
                return acc;
            }, []);

            if(savable.length > 0){
                // Merge already saved
                savable = savable.concat(alreadySaved);

                var raw = JSON.stringify(savable);
                var compressed = LzString.compress(raw);
                
                console.log("saving....");
                localStorage[storageName] = compressed;
                
                console.log("saved to local storage");
            }
        }
        
        /**
         * Helper function to package a table
         * @param {object} table - table to package
         * @return {object} - the packaged table
         */
        static packageTable(table){
            return {
                userid: table.get("userid"),
                id: table.id,
                d: table.get("d"),
                models: table.get("data").map(function(d){
                    return d;
                }),
                data: []
                /*data: table.get("data").reduce(function(dataAcc, model){
                    return dataAcc.concat([model.attributes]);
                }, [])*/
            };
        }
        
        static packageData(packaged){
            packaged.data.push(packaged.models.shift().attributes);
        }
        
        static hash(str){
            assertType(str, "string");
            var hash = 0, i, chr;
            if (str.length === 0) return hash;
            for (i = 0; i < str.length; i++) {
                chr   = str.charCodeAt(i);
                hash  = ((hash << 5) - hash) + chr;
                hash |= 0; // Convert to 32bit integer
            }
            return hash;
        }
    }
    
    return SaveManager;
});


