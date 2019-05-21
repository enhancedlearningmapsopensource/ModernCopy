/**
 * An svg driver to draw shapes, lines, etc on a given svg target. The target is
 * first loaded and then modified.
 */
define(["jquery","jsclass!3rdParty/jsclass/"],
function($, JsClass){

    /**
     * @property {object[]} loadStack - load stack
     */
    class SvgDriver{
        /** @private {any[]} loadStack */
        loadStack

        constructor(){
            var thisClass = this;
            thisClass.loadStack = [];
            Object.defineProperty(thisClass, "topStack", {
                get: function () {
                    return (this.loadStack.length == 0) ? null : this.loadStack[0];
                },
                set: function(val) {
                    // Ignore since we should never be setting the stack top
                    // this.val = val;
                }
            });
        }

        /**
         * Loads the given object into the loader
         * 
         * @param {graph|line|node} ob - the currently loaded object
         */
        load(ob){
            var thisClass = this;
            thisClass.loadStack.unshift(ob);
        }

        /**
         * Unloads the current object from the loader and returns it
         * 
         * @return {graph|line|node} - old loaded object
         */
        unload(){
            var thisClass = this;
            return thisClass.loadStack.shift(ob);
        }
    }
    return SvgDriver;
});