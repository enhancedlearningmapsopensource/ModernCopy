/**
 * The base class for svg elements
 * @module svg/elem
 * @exports SvgElement
 */
define(["jquery","jsclass!3rdParty/jsclass/", "./elem"],
function($, JsClass, SvgElem){
    var pvt = {
        clickHandlerNotificationSent: false
    };

    /**
     * @exports SvgMouseElement
     */
    class SvgMouseElement extends SvgElem{
        constructor(id, options, handlerType){
            super(id, handlerType);
            
            var thisClass = this;
            options = (!options) ? {} : options;
            thisClass._handlers = (!options.handlers) ? null : options.handlers;
            thisClass._overrides = (!options.overrides) ? null : options.overrides;
            thisClass._activeTouches = [];
            
            if(thisClass._handlers === null || !thisClass._handlers.has("click", handlerType)){
                if(!pvt.clickHandlerNotificationSent){
                    pvt.clickHandlerNotificationSent = true;
                    console.warn("no click handler detected for type: " + handlerType + ". ignoring clicks.");
                }
            }else{
                var handler = thisClass._handlers.response("click", handlerType);
                if(handler){
                    thisClass.listenForChange("clicked", handler);
                }
            }
        }
        
        click(e){
            var thisClass = this;
            thisClass.set("clickoptions", {button: e.button, mouse: {x: e.pageX, y: e.pageY}});
            thisClass.set("clicked", true);
            thisClass.set("clicked", false);
        }
        
        mouseDown(e){
            var thisClass = this;
            thisClass.set("mousedown", true);
            thisClass.set("mouse", {x: e.pageX, y: e.pageY});
            return false;
        }
        
        mouseMove(e){
            var thisClass = this;
            if(thisClass.has("mousedown") && thisClass.get("mousedown")){
                var mouseDownPt = thisClass.get("mouse");
                var delta = {
                    x: e.pageX - mouseDownPt.x,
                    y: e.pageY - mouseDownPt.y
                };
                var distance = Math.sqrt(delta.x*delta.x + delta.y*delta.y);
                if(distance > 2){
                    thisClass.set("mousedown", false);
                }
            }
            return false;
        }
        
        mouseUp(e){
            var thisClass = this;
            if(thisClass.has("mousedown") && thisClass.get("mousedown") && !e.consumed){
                thisClass.click(e);
                e.consumed = true;
            }
            thisClass.set("mousedown", false);
            thisClass.set("mouse", null);
            return false;
        }

        /**
         * Recovers the default value of data
         * 
         * @return {object} - default data set
         */
        default(){
            return {
                "clicked" : false,
                "_activeTouches": []
            };
        }
        
        postInit(){
            var thisClass = this;
            if(thisClass._handlers !== null){
                thisClass.elem()[0].addEventListener("mousedown", function(e){thisClass.mouseDown(e);});
                thisClass.elem()[0].addEventListener("mouseup", function(e){thisClass.mouseUp(e);});
                thisClass.elem()[0].addEventListener("mousemove", function(e){thisClass.mouseMove(e);});
                thisClass.elem()[0].addEventListener("keydown", function (e) {
                    thisClass.keyDown(e);
                });
                thisClass.elem()[0].addEventListener("touchstart", function (e) {
                    thisClass.touchStart(e);
                });
                thisClass.elem()[0].addEventListener("touchend", function (e) {
                    thisClass.touchEnd(e);
                });
                thisClass.elem()[0].addEventListener("touchmove", function (e) {
                    thisClass.touchMove(e);
                });
                thisClass.elem()[0].addEventListener("touchcancel", function (e) {
                    thisClass.touchCancel(e);
                });

                thisClass.elem()[0].setAttribute("cursor", "pointer");
                thisClass.elem()[0].setAttribute("pointer-events", "visiblePainted");
            }
        }
        
        keyDown(e){
            throw Error();
        }
        
        touchCancel(e) {
            var thisClass = this;
            thisClass.set("mousedown", false);
            thisClass._activeTouches = [];
        }

        touchEnd(e) {
            e.preventDefault();
            console.log("touch end");

            var thisClass = this;
            var touches = e.changedTouches;
            
            if(thisClass.has("mousedown") && thisClass.get("mousedown") && !e.consumed){
                e.consumed = true;
            //if(touches.)
                thisClass.mouseUp({pageX: touches[0].pageX, pageY: touches[0].pageY, button: 0});
            }
            thisClass._activeTouches = [];
            return false;
            
            
            

            /*var touches = e.changedTouches;
            var activeTouches = thisClass._activeTouches;

            if(thisClass.pinch !== null && typeof thisClass.pinch === 'object'){
                for (var t = 0; t < touches.length; t++) {
                    if (touches[t].identifier == thisClass.pinch.t0 || touches[t].identifier == thisClass.pinch.t1) {
                        thisClass.pinch = null;
                        break;
                    }
                }
            } else if (activeTouches.length == 1) {
                var t = touches[0];
                
            }
            pvt.removeTouches.call(thisClass, touches);
            return false;*/
        }

        touchMove(e) {
            var thisClass = this;
            $("#window-class").html("moving");
            if(thisClass.has("mousedown") && thisClass.get("mousedown")){
                if(thisClass._activeTouches.length > 2){
                    thisClass.set("mousedown", false);
                    thisClass._activeTouches = [];
                    return false;
                }
                
                var mouseDownPt = thisClass.get("mouse");
                var delta = {
                    x: e.changedTouches[0].pageX - mouseDownPt.x,
                    y: e.changedTouches[0].pageY - mouseDownPt.y
                };
                $("#window-class").html("delta: " + delta);
                var distance = Math.sqrt(delta.x*delta.x + delta.y*delta.y);
                if(distance > 2){
                    thisClass.set("mousedown", false);
                    thisClass._activeTouches = [];
                }
            }
            return false;
        }

        touchStart(e) {
            e.preventDefault();

            console.log("touch start");
            //e.consumed = true;

            var thisClass = this;
            var touches = e.changedTouches;
            //var touchData = thisView.model.get("touchData");


            if (touches.length > 0) {
                pvt.addTouches.call(thisClass, touches);

                var active = thisClass._activeTouches;
                if (active.length == 1) {
                    thisClass.mouseDown({pageX: active[0].x, pageY: active[0].y, button: 0});
                }
            }
            return false;
        }
    }
    
        /**
         * Add given touches to the active list
         * @param {TouchList} touches - list of touches
         */
        pvt.addTouches = function (touches) {
           var thisClass = this;
           for (var t = 0; t < touches.length; t++) {
               var touch = touches[t];
               try {
                   thisClass._activeTouches.push(pvt.copyTouch(touch));
               }catch (er){
                   throw Error("pvt.addTouches:: " + er.toString() + "["+Object.keys(touch).join(", ")+"]")
               }

           }
        };
        
        
        
            /**
             * Copies the touch event to prevent browser (mobile safari in particular) from re-using the touch objects
             * @param {Touch} touch - the touch object
             * @return {object} - a copy of the touch object
             */
           pvt.copyTouch = function (touch) {

               if (typeof touch === 'undefined' || touch === null) {
                   throw Error("pvt.copyTouch:: cannot copy invalid object: " + touch);
               }

               if (touch.identifier === null || typeof touch.identifier === 'undefined') {
                   throw Error("pvt.copyTouch:: no identifier for the given touch." + id + "  [" + Object.keys(touch).join(", ") + "]");
               }

               return { id: touch.identifier, x: touch.pageX, y: touch.pageY };
           };
           
            /**
             * Remove given touches from the active list
             * @param {TouchList} touches - list of touches
             */
            pvt.removeTouches = function (touches) {
                var thisClass = this;
                var active = thisClass._activeTouches;
                for (var t = 0; t < touches.length; t++) {
                    for (var a = 0; a < active.length; a++) {
                        if (active[a].id == touches[t].identifier) {
                            active.splice(a, 1);
                            a--;             
                        }
                    }
                }
            };
    
    return SvgMouseElement;
});