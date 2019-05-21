define(["enforced", "common-functions"], function(Enforced){
    class Handler extends Enforced{
        /**
         * Create a new Handler instance
         * 
         * Version A:
         * -------------------------------------
         * @param {string} type - the type of object that triggers the hander response (e.g. node)
         * @param {string} evt - the type of event that triggers the hander response (e.g. click)
         * @param {function} response - the response to the object performing an event
         *
         * Version B:
         * -------------------------------------
         * @param {Object} def - handler definition
         * @param {string} def.type - the type of object that triggers the hander response (e.g. node)
         * @param {string} def.evt - the type of event that triggers the hander response (e.g. click)
         * @param {function} def.response - the response to the object performing an event
         */
        constructor(type, evt, response){
            super("Handler");
            var thisClass = this;
            
            // Get type of type
            assertDefined(type);
            var typeOf = typeof type;
            
            // Translate type def
            if(typeOf == 'object'){
                evt         = type.evt;
                response    = type.response;
                type        = type.type;    // Must be last
            }
            
            if(typeof response === 'undefined'){
                console.warn("invalid response function. Ignoring handler for '"+evt+":"+type+"'");
                thisClass.evt = null;
                thisClass.type = null;
                thisClass.response = null;
            }else{
                assertDefined([type, response, evt]);
                thisClass.type = type;
                thisClass.evt = assertType(evt, 'string');
                thisClass.response = assertType(response, 'function');
            }
        }
        
        /**
         * Indicates a valid handler
         * @return {boolean} - true if valid, otherwise false
         */
        valid(){
            var thisClass = this;
            return (thisClass.evt !== null && thisClass.type !== null && thisClass.response !== null);
        }
    }
    return Handler;
});


