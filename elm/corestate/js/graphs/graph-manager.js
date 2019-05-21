/**
 * Manage changes to graphs.
 * 
 * Manager > State > Definition
 * 
 * Manager: Handles states
 * - stash: graphs that are currently being manipulated by the user (minimized)
 * - activeStack: stack. the top/front is the only graph that can be modified by a user
 * - mapping: hash mapping from objects to handles
 * - Methods:
 *      - void stashActive 
 *      
 * Graph:
 * - handle: allows recovery of the graph
 * 
 */
define(["jquery",
        "jsclass!3rdParty/jsclass/",
        "corestate/js/graphs/graph-state",
        "corestate/js/graphs/json-parser",
        "corestate/js/graphs/graph-planner",
        "constants",
        "lzstring",
        "hub-lib"],
function($, 
         JsClass,
         GraphState,
         JsonParser,
         Planner,
         Constants,
         LzString,
         Hub){
    
    class GraphManager{
        constructor(programState){
            var thisClass = this;
            
            // Check to make sure the program state is legit
            assert(programState.id === "program-state");
            
            /** 
             * The top/front of the stack is the only graph that can be manipulated
             * @private 
             */
            thisClass.__activeStack = [];
            
            /**
             * The collection of all graphs currently being used in the software. Mapped to their state handle
             * @private
             */
            thisClass._stash = new JsClass.Hash();
            
            /**
             * A mapping between a javascript object and a handle
             * @private
             */
            thisClass._mapping = new JsClass.Hash();
            
            /**
             * Indicates whether changes have been applied to the software state
             * @private
             */
            thisClass._current = true;
            
            /**
             * Rolling id
             */
            thisClass._rolling = 0;
            
            // Utilities
            thisClass._utilities = {
                parser: new JsonParser(),
                planner: new Planner(),
                programState: programState
            };
        }
        
        /**
         * Applies all changes to the graph state
         * @param {Object=} prop - additional state properties to set
         * @returns {Promise<boolean>} true if success, otherwise false
         */
        apply(prop){
            var thisClass = this;
            prop = (!prop) ? {} : prop;
            
            prop.activeGraph = null;
            var topHandle = null;
            if(!thisClass.isEmpty()){
                prop.activeGraph = thisClass.__activeStack[0].toUrl();
                topHandle = thisClass.handle();
            }
            
            // Empty the stack
            while(!thisClass.isEmpty()){
                thisClass.pop();
            }
            
            // Push everything onto the stack
            thisClass.pushAll();
            
            var minimizedJson = [];
            while(!thisClass.isEmpty()){
                // Get the top graph 
                var topGraph = thisClass.__activeStack[0];
                
                // Add to minimized
                if(topGraph.handle !== topHandle){
                    minimizedJson.push(topGraph.toJson());
                }
                
                // Pop from stack
                thisClass.pop();
            }
            
            // Replace the original top graph
            if(topHandle !== null){
                thisClass.push(topHandle);
            }
            
            prop.minimizedGraphs = null;
            if(minimizedJson.length > 0){
                prop.minimizedGraphs = thisClass._utilities.parser.stringify(minimizedJson);
            }
            thisClass._utilities.programState.set(prop);
        }
        
        /**
         * Create a new graph state
         * @param {string} graphID - the id/name of the graph
         * @param {Object=} owner - the owner of the object and the one that will be used as the graph's mapping 
         * @returns {string} - the handle of the new state
         */
        create(graphID, owner){
            var thisClass = this;
            var handle = "map-"+thisClass._rolling++;
            owner = (!owner) ? null : owner;
            
            var graphState = new GraphState(handle, graphID);
            thisClass._stash.store(handle, graphState);
           
            if(owner !== null){
                thisClass._mapping.store(owner, handle);
            }
            return handle;
        }
        
        /**
         * Destroy the top graph. Remove from stash
         * @returns {boolean} - true if success, otherwise false
         */
        destroy(){
            var thisClass = this;
            if(thisClass.isEmpty()){
                return false;
            }else{
                // Save the top handle
                var topHandle = thisClass.__activeStack[0].handle;
                
                // Look for the graph in the mapping
                var ownerInMapping = null;
                thisClass._mapping.forEach(function(item){
                    if(item.value == topHandle){
                        if(ownerInMapping !== null){
                            throw Error("Somehow have two graphs mapped to a single owner...");
                        }
                        ownerInMapping = item.key;
                    }
                });
                
                // Remove from mapping
                if(ownerInMapping !== null){
                    thisClass._mapping.remove(ownerInMapping);
                }
                
                // Remove from stash
                thisClass._stash.remove(topHandle);
                
                // Remove all instances from active graph
                for(var i = 0; i < thisClass.__activeStack.length; i++){
                    if(thisClass.__activeStack[i].handle == topHandle){
                        thisClass.__activeStack.splice(i,1);
                        i--;
                    }
                }
            }
            return true;
        }
        
        /**
         * Modify the graph manager to match the given json
         *
         * @param {object} json - the json to match
         */
        fromJson(json) {
            var thisClass = this;
            if (json.hasOwnProperty("g")) {
                json.g.forEach(function (graph) {
                    var handle = thisClass.create(graph.g);
                    thisClass.push(handle);
                    thisClass.__activeStack[0].fromJson(graph);
                    thisClass.pop();
                });
            }
            if (json.hasOwnProperty("ag")) {
                var handle = thisClass.create(json.ag.g);
                thisClass.push(handle);
                thisClass.__activeStack[0].fromJson(json.ag);
            }
            
            // Use new version of graph compression
            if(json.hasOwnProperty("version")){
                var handle = thisClass.create(json.version);
                thisClass.push(handle);
                thisClass.__activeStack[0].fromJson(json);
            }
        }
        
        /**
         * Alias for fromJson
         */
        fromJSON(json) {
            return this.fromJson(json);
        }

        /**
         * Modify the graph manager to match the given url
         *
         * @param {string} url - the url to match
         */
        fromUrl(url) {
            var thisClass = this; 
            try{
                var ob = JSON.parse(LzString.decompressFromEncodedURIComponent(url));  
            }catch(err){
                var ob = JSON.parse("[]");  
            }
            thisClass.fromJson(ob);
        }
        
        /**
         * @note - applies to top of stack
         * 
         * Get a shallow copy of the graph definition. Changes to the copy will NOT affect the stored definition.
         * @returns {GraphDefinition} - a shallow copy of the top graph
         */
        get(){
            return this.__activeStack[0].definition.copy();
        }
        
        /**
         * Get the handle of the graph state on the top of the stack
         * @returns {string} - the handle of the top graph
         */
        handle(){
            return this.__activeStack[0].handle;
        }
        
        /**
         * @returns {boolean} - indicates whether the state has been applied to the software
         */
        isCurrent(){
            
        }
        
        
        
        /**
         * @returns {boolean} - indicates whether there is a graph on the stack
         */
        isEmpty(){
            return (this.__activeStack.length === 0);
        }
        
        /**
         * @returns {boolean} - indicates whether the graph on top of the stack is dirty
         */
        isDirty(){
            var thisClass = this;
            if(thisClass.isEmpty()){
                throw Error("no map on the stack.");
            }
            
            // Get the currently active graph
            var top = thisClass.get();
            
            // Check for custom map
            if(typeof top.graphID === 'string'){
                return true;
            }
            
            // Create a graph from the saved map and load it onto the stack
            var original = thisClass.create(top.graphID);
            thisClass.push(original);
            
            // Load the server model into the graph
            var serverModel = Hub.get("map").get(top.graphID);
            var originalDef = thisClass.get();
            Hub.wrap(serverModel).getNodeColorMap().forEach(function(d){
                originalDef.setNodeColor(d.id, d.color);
            });
            var jsonOriginal = JSON.stringify(originalDef.toJson());
            
            // Destroy and remove from stack without saving
            assert(thisClass.destroy());
            
            // Get the JSON string for the current map
            var jsonCurrent = JSON.stringify(top.toJson());
            
            return (jsonOriginal.localeCompare(jsonCurrent) !== 0);
        }
        
        isNewGraph(){
            return this.__activeStack[0].isNewGraph();
        }
        
        /**
         * Returns the planner
         * @returns {Planner}
         */
        planner(){
            return this._utilities.planner;
        }
        
        /**
         * Pops the top of the graph off of the stack
         * @returns {boolean} - true if success, otherwise false
         */
        pop(){
            var thisClass = this;
            if(thisClass.isEmpty()){
                return false;
            }else{
                thisClass.__activeStack.shift();
                return true;
            }
        }
        
        /**
         * Gets the graph from the stash and pushes it onto the stack
         * 
         * @param {(object|string)} id - either the object associated with a graph or the graph handle
         * @returns {boolean} true if success, otherwise false
         */
        push(id){
            var thisClass = this;
            var pushState = null;
            
            // Check for map handle
            if(typeof id === 'string' && id.substring(0,4) == "map-"){
                if(thisClass._stash.hasKey(id)){
                    pushState = thisClass._stash.fetch(id);
                    thisClass.__activeStack.unshift(pushState);
                    return true;
                }           
            }else{
                if(thisClass._mappings.hasKey(id)){
                    pushState = thisClass._mappings.fetch(id);
                    return push(pushState);
                }
            }
            return false;
        }
        
        /**
         * Push all graphs to the stack in order of handles order asc (newest on the top)
         * @returns {boolean} true if success, otherwise false
         */
        pushAll(){
            var thisClass = this;
            thisClass._stash.map(function(d){
                return d.value.handle;
            }).sort(function(a,b){
                return a.localeCompare(b);
            }).forEach(function(h){
                assert(thisClass.push(h));
            });
            return true;
        }
        
        /**
         * @note - applies to top of stack
         * 
         * Set the graph definition by returning the changed copy from Get
         * @param {GraphDefinition} def - a shallow copy of the definition
         * @returns {boolean} true if success, otherwise false
         */
        set(def){
            assertDefined(def);
            this.__activeStack[0].definition = def;
            return true;
        }
        
        /**
         * Restore from url
         * @param {string} url
         */
        restore(url) {
            var thisClass = this;
            
            var currentUrl = thisClass.toUrl();
            if (currentUrl !== url) {
                //thisClass.clear();
                thisClass._activeGraph = [];
                thisClass._stash = new JsClass.Hash();
                thisClass._mapping = new JsClass.Hash();
                thisClass._current = true;
                thisClass._rolling = 0;
                
                thisClass.fromUrl(url.split("gr=")[1]);
                thisClass.apply();
            }
        }

        /**
         * 
         * @returns {graph-managerL#23.GraphManager.toJson.json}
         */
        toJson() {
            var thisClass = this;
            var json = {};
            
            var topHandle = null;
            if (!thisClass.isEmpty()) {
                // Save the handle of the top graph
                var topHandle = thisClass.handle();
                
                json.ag = thisClass.__activeStack[0].toJson();
            }
            
            
            
            // Empty the stack
            while(!thisClass.isEmpty()){
                thisClass.pop();
            }
            
            // Push everything onto the stack
            thisClass.pushAll();
            
            var minimizedJson = [];
            while(!thisClass.isEmpty()){
                // Get the top graph 
                var topGraph = thisClass.__activeStack[0];
                
                // Add to minimized
                if(topGraph.handle != topHandle){
                    minimizedJson.push(topGraph.toJson());
                }
                
                // Pop from stack
                thisClass.pop();
            }
            
            // Replace the original top graph
            if(topHandle !== null){
                thisClass.push(topHandle);
            }

            // Add to json
            if (minimizedJson.length > 0) {
                json.g = minimizedJson;
            }
            
            return json;
        }

        /**
         * 
         * @returns {String}
         */
        toUrl() {
            var thisClass = this;
            var str = JSON.stringify(thisClass.toJson());
            var compressed = LzString.compressToEncodedURIComponent(str);
            return "gr=" + compressed;
        }
        
    }
    
    return GraphManager;
});