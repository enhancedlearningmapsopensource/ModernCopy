/**
 * The base class for svg elements
 * @module svg/elem
 * @exports SvgElement
 */
define(["jquery","jsclass!3rdParty/jsclass/", "velocity", "enforced"],
function($, JsClass, velocity, Enforced){
    var pvt = {};

    /**
     * @exports SvgElement
     */
    class SvgElement extends Enforced{
        constructor(id, type){
            assertDefined(type, "No type provided. Please provide object enforced type.");
            super(type);
            
            var thisClass = this;
            thisClass._$el = null;
            thisClass.retask(id);
            Object.defineProperty(thisClass, "id", {
                get: function () {
                    return this._id;
                },
                set: function(val) {
                    // Ignore since we should never be setting the stack top
                    // this.val = val;
                }
            });
        }
        
        /**
         * 
         * @param {DOM} elem
         * @param {Object} properties
         * @param {number} time - time in ms
         * @param {number} frames - animation frames
         * @returns {undefined}
         */
        animate(elem, properties, time, frames){
            function animateProp(elem, prop, values, inc, last){
                if(values.length > 0){
                    var elapsed = Date.now() - last;
                    if(!isNaN(elapsed)){
                        var expected = inc;
                        while(elapsed > expected && values.length > 1){
                            values.shift();
                            elapsed -= inc;
                        }
                    }
                    elem.setAttribute(prop, values.shift());
                    
                    var now = Date.now();
                    setTimeout(animateProp, inc, elem, prop, values, inc, now);
                }
            }
            
            var acceptedProps = ["transform"];
            acceptedProps = new JsClass.Set(acceptedProps);
            
            Object.keys(properties).forEach(function(k){
                switch(k){
                    case "transform":
                        // Last frame is to align
                        var msPerFrame = time/frames;
                        
                        var currValue = elem.getAttribute(k);
                        var nextValue = properties[k];
                        $(elem).velocity({translateX: nextValue.x, translateY: nextValue.y, scaleX: nextValue.scale, scaleY: nextValue.scale}, { duration: "slow" });
                        return;
                        
                        /*if(currValue !== null){
                            var re = /.*scale\(([-|\d|\.]+)\s*[-|\d|\.]+\)\s*translate\(([-|\d|\.]+)\s*([-|\d|\.]+)\).*/;
                            /*var result = re.exec(currValue);
                            var s = Number(result[1]);
                            var x = Number(result[2]);
                            var y = Number(result[3]);
                            
                            var ds = (nextValue.scale - s)/(frames - 2);
                            var dx = (nextValue.x - x)/(frames - 2);
                            var dy = (nextValue.y - y)/(frames - 2);
                            
                            var aFrames = [currValue];
                            var cs = s;
                            var cx = x;
                            var cy = y;
                            for(var i = 0; i < frames - 2; i++){
                                cs += ds;
                                cx += dx;
                                cy += dy;
                                aFrames.push("scale(" + cs + " " + cs + ") translate(" + cx + " " + cy + ")");
                            }
                            aFrames.push("scale(" + nextValue.scale + " " + nextValue.scale + ") translate(" + nextValue.x + " " + nextValue.y + ")")
                            
                            assert(aFrames.length == frames);
                            assert(aFrames[0] == currValue);
                            
                            animateProp(elem, k, aFrames, msPerFrame);
                        }
                        
                        
                        
                        
                        break;*/
                    default:
                        console.warn("cannot animate: " + k);
                }
            });
        }
        
        bounds(){
            return this._$el[0].getBoundingClientRect();
        }
        
        changed(){
            return (Object.keys(this._changed).length > 0);
        }

        /**
         * Recovers the default value of data
         * 
         * @return {object} - default data set
         */
        default(){
            return {};
        }
        
        draw(){
            var thisClass = this;
            var drawRes = thisClass._draw();
            thisClass._changed = {};
            thisClass._previous = {};
            
            return drawRes;
        }

        /**
         * Get the bound DOM element
         * 
         * @return {object} - the jquery object
         */
        elem(){
            return this._$el;
        }

        /**
         * Get the value of an attribute
         * @param {string} key - attribute name 
         */
        get(key){
            var thisClass = this;
            return thisClass._data[key];
        }

        /**
         * Check to see if the elem has an attribute
         * @param {string} key - key to check
         * @return {bool} - true if the element contains the attribute, otherwise false
         * @memberof SvgElement
         */
        has(key){
            return this._data.hasOwnProperty(key);
        }

        /**
         * Listen a variable and react when it is set
         * @param {string} key - variable to listen to
         * @param {function} callback - callback function on change
         */
        listenForChange(key, callback){
            assertType(key, 'string');
            assertType(callback, 'function');
            
            var thisClass = this;
            var listeners = thisClass._listeners;
            if(!listeners.hasOwnProperty(key)){
                listeners[key] = [];
            }
            listeners[key].push(callback);
        }
        
        /**
         * Retask an element to a different object id. Also removes the element from the svg
         */
        retask(id){
            var thisClass = this;
            thisClass._id = id;
            thisClass._data = thisClass.default();
            thisClass._changed = {};
            thisClass._previous = {};
            thisClass._listeners = (!thisClass._listeners) ? {} : thisClass._listeners;

            if(thisClass._$el !== null){
                thisClass.reset();
            }
        }

        /**
         * Resets the svg properties, effectively hiding the element
         */
        reset(){
            throw Error(this.name + " does not yet implement 'reset'");
        }

        /**
         * Sets the value of the element's data
         * 
         * @param {string|object} e - the data attribute name 
         * @param {any} t - the attribute value 
         * @param {object|void} o - options
         * 
         * Configuration 1:
         * param {string} e - the data attribute name 
         * param {any} t - the attribute value 
         * param {object} o - options
         * 
         * Configuration 2:
         * param {object} e - the object containing attributes to set
         * param {string} e[i].key - the data attribute name
         * param {string} e[i].val - the data attribute value
         * param {object} t - options
         * 
         * e.g. ob.set({attra: 1, attrb: 2});
         */
        set(e, t, o){
            var thisClass = this;
            var typeofe = typeof e;
            var typeoft = typeof t;
            var typeofo = typeof o;
            if(typeofe === 'string' && typeoft !== 'undefined'){
                if(e.trim() !== "id"){
                    pvt.changeData.call(thisClass, e, t);
                }
            }else if(typeofe === 'object'){
                Object.keys(e).forEach(function(d){
                    thisClass.set(d, e[d]);
                });
            }else{
                throw Error("invalid parameters");
            }
        }
    }

    pvt.areEqual = function(a, b){
        return pvt.deepCompare(a,b);
    }
    
    /**
     * Checks the class to see if the value exists already. If it does and if the value is different then it:
     * 1. Stores the current value as 'previous'
     * 2. Marks the attribute as having changed
     * 3. Sets the value
     * 
     * If it doesn't exist then it is added. If it does exist but is the same as before then it is ignored.
     * 
     * @param {string} key - the key
     * @param {any} valur - the value to set
     */
    pvt.changeData = function(key, value){
        var thisClass = this;
        
        if(key === "transformx"){
            var k =0;
        }

        // The key already exists so we need to check for a change
        if(thisClass.has(key)){
            // The keys are not equal so mark the attribute as having changed otherwise igore the request
            if(!pvt.areEqual(thisClass.get(key), value)){

                // This is the first time this attribute has changed since the last render
                if(!thisClass._previous.hasOwnProperty(key)){
                    thisClass._previous[key] = [];
                }

                // Record the current value
                thisClass._previous[key].push(thisClass.get(key));

                // Record the changed value and set the attribute
                thisClass._changed[key] = value;

                // Set the data
                thisClass._data[key] = value;
                
                // Check for listener
                if(thisClass._listeners.hasOwnProperty(key)){
                    thisClass._listeners[key].forEach(function(callback){
                        callback(thisClass.id, thisClass);
                    });
                }
            }
        }

        // There is no record of this attribute in the class so set it
        else{
            thisClass._data[key] = value;
            
            // Record the changed value and set the attribute
            thisClass._changed[key] = value;
            
            // Check for listener
            if(thisClass._listeners.hasOwnProperty(key)){
                thisClass._listeners[key].forEach(function(callback){
                    callback(thisClass.id, thisClass);
                });
            }
        }
    }

    pvt.deepCompare = function(a, b) {
        var i, l, leftChain, rightChain;
        var arguments = [a,b];

        function compare2Objects (x, y) {
            var p;

            // remember that NaN === NaN returns false
            // and isNaN(undefined) returns true
            if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
                return true;
            }

            // Compare primitives and functions.     
            // Check if both arguments link to the same object.
            // Especially useful on the step where we compare prototypes
            if (x === y) {
                return true;
            }

            // Works in case when functions are created in constructor.
            // Comparing dates is a common scenario. Another built-ins?
            // We can even handle functions passed across iframes
            if ((typeof x === 'function' && typeof y === 'function') ||
            (x instanceof Date && y instanceof Date) ||
            (x instanceof RegExp && y instanceof RegExp) ||
            (x instanceof String && y instanceof String) ||
            (x instanceof Number && y instanceof Number)) {
                return x.toString() === y.toString();
            }

            // At last checking prototypes as good as we can
            if (!(x instanceof Object && y instanceof Object)) {
                return false;
            }

            if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
                return false;
            }

            if (x.constructor !== y.constructor) {
                return false;
            }

            if (x.prototype !== y.prototype) {
                return false;
            }

            // Check for infinitive linking loops
            if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
                return false;
            }

            // Quick checking of one object being a subset of another.
            // todo: cache the structure of arguments[0] for performance
            for (p in y) {
                if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                    return false;
                }
                else if (typeof y[p] !== typeof x[p]) {
                    return false;
                }
            }

            for (p in x) {
                if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                    return false;
                }
                else if (typeof y[p] !== typeof x[p]) {
                    return false;
                }

                switch (typeof (x[p])) {
                    case 'object':
                    case 'function':

                        leftChain.push(x);
                        rightChain.push(y);

                        if (!compare2Objects (x[p], y[p])) {
                            return false;
                        }

                        leftChain.pop();
                        rightChain.pop();
                        break;

                    default:
                        if (x[p] !== y[p]) {
                            return false;
                        }
                        break;
                }
            }

            return true;
        }

        /*if (arguments.length < 1) {
            return true; //Die silently? Don't know how to handle such case, please help...
            // throw "Need two or more arguments to compare";
        }*/

        for (i = 1, l = arguments.length; i < l; i++) {

            leftChain = []; //Todo: this can be cached
            rightChain = [];

            if (!compare2Objects(arguments[0], arguments[i])) {
                return false;
            }
        }

        return true;
    }


    return SvgElement;
});