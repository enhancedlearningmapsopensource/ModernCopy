/**
 * Integer
 * @typedef {number} int
 * 
 * @typedef {Object} NodeOb
 * @property {int} id - node id
 * @property {string} text - the text of the node
 * @property {string} radius - the radius of the node
 * @property {string} color - the fill color of the node
 * @property {object} stroke - the node edge
 * @property {string} stroke.color - the color of the edge
 * @property {int} stroke.width - the width of the edge
 * @property {object=null} transform - the node transform
 * @property {number=0} transform.x - the node x coord
 * @property {number=0} transform.y - the node y coord
 * @property {number=1} transform.scale - the node scale
 */


/**
 * Module representing a graph
 * @module svg/graph
 * 
 */
define('svg-lib/canvas', ["jquery", "jsclass!3rdParty/jsclass/", "./elem"],
        function ($, JsClass, SvgElement) {

            var pvt = {};

            /**
             * @extends SvgElement
             */
            class SvgCanvas extends SvgElement {
                /**
                 * Creates an instance of SvgGraph.
                 * @param {int} id - the graphid
                 * @param {GraphPlanner} planner - planner for graph layout
                 */
                constructor(id, $el, options) {
                    super(id, "SvgCanvas");

                    var thisClass = this;
                    thisClass.name = thisClass._enforcedType;
                    thisClass._$el = $el;

                    // Handlers
                    thisClass._handlers = (!options.handlers) ? null : options.handlers;
                    assertType(thisClass._handlers, "HandlerSet");
                    
                    thisClass._overrides = (!options.overrides) ? null : options.overrides;
                    thisClass._mousePos = null;
                    thisClass._shiftState = {
                        left: false,
                        right: false
                    };
                    thisClass.activeTouches = [];
                    thisClass.pinch = null;

                    if (thisClass._handlers === null || !thisClass._handlers.has("click", "graph")) {
                        console.warn("no click handler detected for type: graph. ignoring clicks.");
                    } else {
                        thisClass.listenForChange("clicked", thisClass._handlers.response("click", "graph"));
                    }
                    
                    if (thisClass._handlers === null || !thisClass._handlers.has("shift", "graph")) {
                        console.warn("no shift handler detected for type: graph. ignoring shift key changes.");
                    } else {
                        thisClass.listenForChange("shift", thisClass._handlers.response("shift", "graph"));
                    }
                    
                    $(window)[0].addEventListener("keydown", function (e) {
                        switch(e.code){
                            case "ArrowUp":
                            case "ArrowDown":
                                pvt.arrowKeys.call(thisClass, e);
                                break;
                            case "ShiftLeft":
                            case "ShiftRight":
                                thisClass.shift(e.code, true);
                                break;
                        }
                    });
                    $(window)[0].addEventListener("keypress", function (e) {
                        //throw Error();
                    });
                    $(window)[0].addEventListener("keyup", function (e) {
                        switch(e.code){
                            case "ShiftLeft":
                            case "ShiftRight":
                                thisClass.shift(e.code, false);
                                break;
                        }
                    });

                    // Mouse Events
                    thisClass.elem()[0].addEventListener("mousedown", function (e) {
                        thisClass.mouseDown(e);
                    });
                    thisClass.elem()[0].addEventListener("mouseup", function (e) {
                        thisClass.mouseUp(e);
                    });
                    thisClass.elem()[0].addEventListener("mousemove", function (e) {
                        thisClass.mouseMove(e);
                    });
                    thisClass.elem()[0].addEventListener("mousewheel", function (e) {
                        thisClass.mouseWheel(e);
                    });
                    
                    var $body = $(".site-body");
                    if($body.length > 0){
                        $(".site-body")[0].addEventListener("keydown", function (e) {
                            thisClass.keyDown(e);
                        });
                    }
                    

                    // Touch Events
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
                }

                click(e) {
                    var thisClass = this;
                    thisClass.set("clickoptions", {button: e.button, mouse: {x: e.pageX, y: e.pageY}});
                    thisClass.set("clicked", true);
                    thisClass.set("clicked", false);
                }
                
                disableNodes(){
                    var thisClass = this;
                    thisClass.get("graph").elem()[0].setAttribute("pointer-events", "none");
                    thisClass.get("graph").get("nodes").forEach(function (n) {
                        n.value.elem()[0].setAttribute("pointer-events", "none");
                    });
                    thisClass.get("graph").get("edges").forEach(function (n) {
                        n.value.elem()[0].setAttribute("pointer-events", "none");
                    });
                }
                
                keyDown(e){
                    //throw Error();
                }

                /**
                 * 
                 * 
                 * @listens mousedown:SvgGraph.elem()
                 * @memberof SvgGraph
                 */
                mouseDown(e) {
                    var thisClass = this;

                    var mouse = {x: e.clientX, y: e.clientY};
                    mouse = pvt.convertRealSpaceToTransformedSpace.call(thisClass, mouse);

                    thisClass.set("drag", mouse);
                    thisClass.set("dragOrigTrans", {
                        x: thisClass.get("graph").get("transformx"),
                        y: thisClass.get("graph").get("transformy"),
                    });

                    //thisClass.disableNodes();
                }

                mouseMove(e) {
                    var thisClass = this;

                    var drag = thisClass.get("drag");
                    thisClass._mousePos = {x: e.clientX, y: e.clientY};
                    if (drag !== null) {
                        var dragOrigTrans = thisClass.get("dragOrigTrans");
                        var mouse = {x: e.clientX, y: e.clientY};
                        var mouseSvg = pvt.convertRealSpaceToTransformedSpace.call(thisClass, mouse);

                        var delta = {
                            x: mouseSvg.x - drag.x,
                            y: mouseSvg.y - drag.y
                        };

                        if (delta.x != 0 || delta.y != 0) {
                            thisClass.get("graph").set("transformx", dragOrigTrans.x + delta.x);
                            thisClass.get("graph").set("transformy", dragOrigTrans.y + delta.y);
                            thisClass.get("graph").move();
                        }
                    }

                    e.cancelBubble = true;
                    e.returnValue = false;
                    return false;
                }

                mouseUp(e) {
                    var thisClass = this;
                    var drag = thisClass.get("drag");
                    if(thisClass.get("drag") !== null){
                        thisClass.set("drag", null);

                        // Get the distance between the points
                        var mouse = {x: e.clientX, y: e.clientY};
                        var mouseSvg = pvt.convertRealSpaceToTransformedSpace.call(thisClass, mouse);
                        var delta = {
                            x: mouseSvg.x - drag.x,
                            y: mouseSvg.y - drag.y
                        };

                        var distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
                        if (distance < 2 && !e.consumed) {
                            thisClass.click(e);
                        }
                    }
                }

                mouseWheel(e) {
                    var thisClass = this;
                    var crossDelta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
                    var newScale = 1;
                    if (crossDelta < 0) {
                        newScale = 0.9;
                    } else if (crossDelta > 0) {
                        newScale = 1.1;
                    }
                    //newScale += 0.2;

                    var mouse = {x: e.clientX, y: e.clientY};
                    var preMouse = pvt.convertRealSpaceToTransformedSpace.call(thisClass, mouse, true);
                    var preMouseP1 = pvt.convertRealSpaceToTransformedSpace.call(thisClass, {x: mouse.x + 1, y: mouse.y + 1});


                    var scale = thisClass.get("graph").get("transformscale");
                    thisClass.get("graph").set("transformscale", scale * newScale);
                    thisClass.get("graph").move();

                    var postMouse = pvt.convertRealSpaceToTransformedSpace.call(thisClass, mouse, true);

                    var x = thisClass.get("graph").get("transformx");
                    var y = thisClass.get("graph").get("transformy");
                    var delta = {
                        x: preMouse.x - postMouse.x,
                        y: preMouse.y - postMouse.y
                    }

                    thisClass.get("graph").set("transformx", x - delta.x);
                    thisClass.get("graph").set("transformy", y - delta.y);
                    thisClass.get("graph").move();
                }

                default() {
                    var thisClass = this;
                    return {
                        // Reset the drag
                        drag: null,
                    };
                }

                reset() {
                    var thisClass = this;
                }

                touchCancel(e) {
                    var thisClass = this;
                    thisClass.activeTouches = [];
                }

                touchEnd(e) {
                    if (e.consumed) {
                        return;
                    }

                    e.preventDefault();
                    console.log("touch end");

                    var thisClass = this;

                    var touches = e.changedTouches;
                    var activeTouches = thisClass.activeTouches;

                    if (thisClass.pinch !== null && typeof thisClass.pinch === 'object') {
                        for (var t = 0; t < touches.length; t++) {
                            if (touches[t].identifier == thisClass.pinch.t0 || touches[t].identifier == thisClass.pinch.t1) {
                                thisClass.pinch = null;
                                break;
                            }
                        }
                    } else if (activeTouches.length == 1) {
                        var t = touches[0];
                        thisClass.mouseUp({clientX: t.clientX, clientY: t.clientY, pageX: t.pageX, pageY: t.pageY, button: 0});
                    }
                    pvt.removeTouches.call(thisClass, touches);
                    thisClass.activeTouches = [];
                }

                touchMove(e) {
                    e.preventDefault();

                    var thisClass = this;
                    var touches = e.changedTouches;
                    
                    var active = thisClass.activeTouches;
                    if (active.length == 2) {
                        if (thisClass.pinch === null) {
                            //thisClass.disableNodes();
                            thisClass.pinch = {
                                t0: active[0].id,
                                t1: active[1].id,
                                originalDistance: null,
                                currentDistance: null,
                                originalCenter: null,
                                numZoom: 0,
                                runningAv: [],
                            }

                            var t0 = active[0];
                            var t1 = active[1];

                            thisClass.pinch.originalDistance = Math.sqrt(((t0.x - t1.x) * (t0.x - t1.x)) + ((t0.y - t1.y) * (t0.y - t1.y)));
                            thisClass.pinch.originalCenter = { x: (t0.x + t1.x) / 2, y: (t0.y + t1.y) / 2 };

                            var maxRunningAv = 3;
                            for (var i = 0; i < maxRunningAv; i++) {
                                thisClass.pinch.runningAv.push(0);
                            }

                        } else if (thisClass.pinch.t0 != active[0].id && thisClass.pinch.t1 != active[0].id && thisClass.pinch.t0 != active[1].id && thisClass.pinch.t1 != active[1].id) {
                            throw Error("lost contact points");
                        } else {
                            assertDefined(pvt);

                            //var original0 = pvt.getTouch.call(thisClass, thisClass.pinch.t0);
                            //var original1 = pvt.getTouch.call(thisClass, thisClass.pinch.t1);
                            var current0 = null;
                            var current1 = null;

                            for (var t = 0; t < touches.length; t++) {
                                var touch = touches[t];
                                if (touch.identifier == thisClass.pinch.t0) {
                                    current0 = pvt.copyTouch(touch);
                                } else if (touch.identifier == thisClass.pinch.t1) {
                                    current1 = pvt.copyTouch(touch);
                                } else {
                                    throw Error("unknown touch");
                                }
                            }
                            
                            if(current0 === null || current1 === null){
                                return;
                            }
                            
                            



                            var currentDistance = Math.sqrt(((current0.x - current1.x) * (current0.x - current1.x)) + ((current0.y - current1.y) * (current0.y - current1.y)));
                            thisClass.pinch.currentDistance = currentDistance;
                            var center = {};
                            center.x = thisClass.pinch.originalCenter.x;
                            center.y = thisClass.pinch.originalCenter.y;
                            
                            var out = "origDistance: " + thisClass.pinch.originalDistance + "<br />";
                            out += "currDistance: " + currentDistance + "<br />";

                            $("#window-class").html(currentDistance - thisClass.pinch.originalDistance);
                            var percentChange = Math.floor((currentDistance - thisClass.pinch.originalDistance) / Math.abs(thisClass.pinch.originalDistance));
                            //var percentChange = 0;

                            //percentChange *= 10;
                            //percentChange = Math.floor(percentChange);

                            while (thisClass.pinch.numZoom > percentChange) {
                                thisClass.mouseWheel({ wheelDelta: 120, detail: 0, clientX: center.x, clientY: center.y });
                                thisClass.pinch.numZoom--;
                            }

                            while (thisClass.pinch.numZoom < percentChange) {
                                thisClass.mouseWheel({ wheelDelta: -120, detail: 0, clientX: center.x, clientY: center.y });
                                thisClass.pinch.numZoom++;
                            }

                        }
                    } else if (active.length == 1) {
                        // Get the current value of the changed touch
                        var changedTouch = touches[0];
                        thisClass.mouseMove({ pageX: changedTouch.pageX, pageY: changedTouch.pageY, clientX: changedTouch.clientX, clientY: changedTouch.clientY});
                    }

                    return false;
                }
                
                shift(code, on){
                    var thisClass = this;
                    switch(code){
                        case "ShiftLeft":
                            if(thisClass._shiftState.left != on){
                                thisClass._shiftState.left = on;
                            }
                            break;
                        case "ShiftRight":
                            if(thisClass._shiftState.right != on){
                                thisClass._shiftState.right = on;
                            }
                            break;
                    }
                    thisClass.set("shift", (thisClass._shiftState.left || thisClass._shiftState.right));
                }
                
                

                touchStart(e) {
                    if (e.consumed) {
                        return;
                    }

                    e.preventDefault();

                    console.log("touch start");

                    var thisClass = this;
                    var touches = e.changedTouches;


                    if (touches.length > 0) {
                        pvt.addTouches.call(thisClass, touches);

                        var active = thisClass.activeTouches;
                        if (active.length == 1) {
                            thisClass.mouseDown({clientX: active[0].x, clientY: active[0].y, pageX: active[0].x, pageY: active[0].y, button: 0});
                        }else{
                            console.log("touches: " + active.length);
                        }
                    }
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
                        thisClass.activeTouches.push(pvt.copyTouch(touch));
                    } catch (er) {
                        throw Error("pvt.addTouches:: " + er.toString() + "[" + Object.keys(touch).join(", ") + "]")
                    }

                }
            };
            
            pvt.arrowKeys = function(e){
                var thisClass = this;
                var wheelDelta = null;
                if(e.code == "ArrowUp"){
                    wheelDelta = 120;
                }else if(e.code == "ArrowDown"){
                    wheelDelta = -120;
                }
                if(wheelDelta !== null && thisClass._mousePos !== null){
                    thisClass.mouseWheel({
                        currentTarget: thisClass.elem()[0],
                        wheelDelta: wheelDelta,
                        detail: 0,
                        clientX: thisClass._mousePos.x,
                        clientY: thisClass._mousePos.y
                    });
                }
            }

            pvt.convertRealSpaceToTransformedSpace = function (pageOffset, useGraph) {
                var thisClass = this;
                var svg = thisClass.elem()[0];
                var pt = svg.createSVGPoint();

                useGraph = (typeof useGraph === 'undefined' || useGraph === null) ? false : useGraph;

                var relativeTo = (useGraph) ? thisClass.get("graph").elem()[0] : svg;

                pt.x = pageOffset.x;
                pt.y = pageOffset.y;
                var svgP = pt.matrixTransform(relativeTo.getScreenCTM().inverse());
                return {
                    x: svgP.x,
                    y: svgP.y
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

                return {id: touch.identifier, x: touch.clientX, y: touch.clientY};
            };

            /**
             * Remove given touches from the active list
             * @param {TouchList} touches - list of touches
             */
            pvt.removeTouches = function (touches) {
                var thisClass = this;
                var active = thisClass.activeTouches;
                for (var t = 0; t < touches.length; t++) {
                    for (var a = 0; a < active.length; a++) {
                        if (active[a].id == touches[t].identifier) {
                            active.splice(a, 1);
                            a--;
                        }
                    }
                }
            };
            
            /**
             * Get the touch from the active list
             * @param {number} id - the id of the touch event
             * @return {object} - a copy of the touch object or null if none exists
             */
           pvt.getTouch = function (id) {
               var thisClass = this;
               var active = thisClass.activeTouches;
               for (var i = 0; i < active.length; i++) {
                   if (active[i].id == id) {
                       return active[i];
                   }
               }
               return null;
           }

            return SvgCanvas;
        });