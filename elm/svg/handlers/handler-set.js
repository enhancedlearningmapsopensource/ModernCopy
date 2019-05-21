define(["./handler", "jsclass!3rdParty/jsclass/", "enforced"], function(Handler, JsClass, Enforced){
    class HandlerSet extends Enforced{
        /**
         * Create a new HandlerSet instance
         * @param {Object[]=} handlerDef - set of handler definitions as objects
         */
        constructor(handlerDef){
            super("HandlerSet");
            var thisClass = this;
            
            // Create data structure
            // Response call: thisClass._handlers.fetch(<event>).fetch(<type>)()
            thisClass._handlers = new JsClass.Hash();
            
            // Add any handlers via thier definitions
            if(typeof handlerDef !== 'undefined' && handlerDef !== null){
                assertType(handlerDef, "Object[]");
                handlerDef.forEach(function(def){
                    try{
                        thisClass.addHandlerDefinition(def);
                    }catch(ex){
                        throw Error("Error adding definition.\nMessage: " + ex.message + "\nInner Exception:(\n-----------------------\n" + ex.stack + "\n)");
                    }
                });
            }
        }
        
        /**
         * Add a new handler using its definition
         * @param {object} def - handler defintion
         */
        addHandlerDefinition(def){
            var thisClass = this;
            var handler = new Handler(def);
            if(handler.valid()){
                thisClass.addHandler(handler);
            }
        }
        
        /**
         * Add a new handler using its definition
         * @param {Handler} handler - handler (@see svg/handler/handler.js)
         */
        addHandler(handler){
            var thisClass = this;
            assertDefined([thisClass._handlers, handler]);
             
            if(!thisClass._handlers.hasKey(handler.evt)){
                thisClass._handlers.store(handler.evt, new JsClass.Hash());
            }
            thisClass._handlers.fetch(handler.evt).store(handler.type, handler);
        }
        
        /**
         * Checks to see if the handler with the given traits exists
         * @param {string} type - the type of object that triggers the hander response (e.g. node)
         * @param {string} evt - the type of event that triggers the hander response (e.g. click)
         * @return {boolean} - true if the handler exists, otherwise false
         */
        has(evt, type){
            var thisClass = this;
            if(!thisClass._handlers.hasKey(evt)){
                return false;
            }else if(!thisClass._handlers.fetch(evt).hasKey(type)){
                return false;
            }else{
                return true;
            }
        }
        
        /**
         * Get the response for the given event
         * @param {string} type - the type of object that triggers the hander response (e.g. node)
         * @param {string} evt - the type of event that triggers the hander response (e.g. click)
         * @return {function} - the response to the event for the given type
         */
        response(evt, type){
            return this._handlers.fetch(evt).fetch(type).response;
        }
    }
    return HandlerSet;
});


