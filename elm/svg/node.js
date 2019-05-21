/**
 * Encapsulates the graph object
 */
define(["jquery","jsclass!3rdParty/jsclass/", "./elem-mouse", "./node-text"],
function($, JsClass, SvgMouseElement, SvgNodeText){
    var pvt = {
        textRenderNotificationSent: false,
        consts:{
            SMOOTHNESS: 1000
        }
    };

    class SvgNode extends SvgMouseElement{
        
        /**
         * 
         * @param {number} id
         * @param {Object} options
         * @param {Object[]}} options.handlers - handlers for events
         * @param {function[]}} options.handlers.click - handlers for click events
         * @param {(number, SvgNode)=>void} options.handlers.click.node - handler for node clicks
         * @param {(number, SvgEdge)=>void} options.handlers.click.edge - handler for edge clicks
         * @param {(any*)=>SvgNode} options.overrides - constructors used to override object
         * @param {(any*)=>SvgNode} options.overrides.node - node override object
         * @param {TextManager} options.text - the text manager
         */
        constructor(id, options){
            super(id, options, "node");
            
            var thisClass = this;
            
            // Configure options
            options = (!options) ? {} : options;
            thisClass._utility = {};
            thisClass._utility.text = (!options.text) ? null : options.text;
            thisClass._handlers = (!options.handlers) ? null : options.handlers;
            thisClass._overrides = (!options.overrides) ? null : options.overrides;
            
            // Verify handler type
            if(options.handlers){
                assertType(options.handlers, "HandlerSet");
            }
            
            // Enure that the shap exists
            assert(options.hasOwnProperty("shape"));
            assert(options.hasOwnProperty("radius"));

            // Create DOM element
            thisClass.name = "SvgNode";
            thisClass._$el = $(document.createElementNS("http://www.w3.org/2000/svg", "g"));
            switch(options.shape){
                case "circle":
                    thisClass._$circle = $(document.createElementNS("http://www.w3.org/2000/svg", "circle"));
                    break;
                case "andgate":
                    thisClass._$circle = $(document.createElementNS("http://www.w3.org/2000/svg", "polygon"));
                    
                    var radius = options.radius;
                    var topLine = [-radius,radius].join();
                    var botLine = [-radius,-radius].join();
                    var sideArc = pvt.getArc(pvt.consts.SMOOTHNESS,radius,[0,1,2,3]);
                    
                    // Rotate the points to point down
                    var points = [botLine, sideArc, topLine].join(" ").split(" ").map(function(vec2){
                        var n = vec2.split(",");
                        return [Number(n[1]), Number(n[0])].join(",");
                    }).join(" ");
                    
                    thisClass._$circle[0].setAttribute("points", points);
                    
                    break;
                case "notgate":
                    thisClass._$circle = $(document.createElementNS("http://www.w3.org/2000/svg", "polygon"));
                    
                    
                    var r = options.radius;
                    var s = 0.25;
                    var circleArc = pvt.getArc(pvt.consts.SMOOTHNESS, s*r, [0,1,2,3,4,5,6,7]);
                    
                    // Shift arc down
                    circleArc = circleArc.split(" ").map(function(vec2){
                        var n = vec2.split(",");
                        return [Number(n[0]), Number(n[1]) + r - (s*r)];
                    }).map(function(v){
                        return v.join(",");
                    }).join(" ");
                    
                    thisClass._$circle[0].setAttribute("points", circleArc + " -"+r+",-"+r+" "+r+",-"+r+" 0,"+(r-(2*s*r))+"");
                    
                    break;
                case "orgate":
                    thisClass._$circle = $(document.createElementNS("http://www.w3.org/2000/svg", "polygon"));
                    
                    var r = options.radius;
                    var topArc = pvt.getArc(pvt.consts.SMOOTHNESS, 2*r, [0,1]).split(" ").map(function(vec2){
                        var n = vec2.split(",");
                        return [Number(n[0]) - 0.725*r, Number(n[1]) + r];
                    }).filter(function(v){
                        return (v[0] <= r && v[1] <= r);
                    }).map(function(v){
                        return v.join(",");
                    });
                    var topStart = topArc[0];       
                    topArc = topArc.join(" ");
                    
                    var botArc = pvt.getArc(pvt.consts.SMOOTHNESS, 2*r, [2,3]);
                    botArc = botArc.split(" ").map(function(vec2){
                        var n = vec2.split(",");
                        return [Number(n[0]) - 0.725*r, Number(n[1]) - r];
                    }).filter(function(v){
                        return (v[0] <= r && v[1] <= r);
                    }).map(function(v){
                        return v.join(",");
                    }).join(" ");
                    
                    var innerArc = pvt.getArc(pvt.consts.SMOOTHNESS, 1.5*r, [1,2]).split(" ").map(function(vec2){
                        var n = vec2.split(",");
                        return [Number(n[0]) - 2.125*r, -1*Number(n[1])];
                    }).filter(function(v){
                        return (v[0] <= r && Math.abs(v[1]) <= r);
                    }).map(function(v){
                        return v.join(",");
                    }).join(" ");
                    
                    // Rotate the points to point down
                    var points = [topArc,botArc,innerArc].join(" ").split(" ").map(function(vec2){
                        var n = vec2.split(",");
                        return [Number(n[1]), Number(n[0])].join(",");
                    }).join(" ");
                    
                    thisClass._$circle[0].setAttribute("points", points);                    
                    break;
            }
            thisClass._$el[0].appendChild(thisClass._$circle[0]);
            
            // Create, save, and listen to text
            if(options.text !== null){            
                var text = new SvgNodeText('svg-text-'+id, {text: options.text,
                                                            handlers: thisClass._handlers, 
                                                            overrides: thisClass._overrides});
                thisClass.set("svgText", text);
                thisClass._$el[0].appendChild(text.elem()[0]);
            }
            
            var g = thisClass._$el;
            thisClass._$el = thisClass._$circle;
            thisClass.postInit();
            thisClass._$el = g;
        }
        
        default(){
            return {
                hasChildren: false,
                hasParents: false
            };
        }
        
        _draw(){
            var thisClass = this;
            assert(thisClass.has("font"));
            assert(thisClass.has("shape"));
            
            if(Object.keys(thisClass._changed).length > 0){
                var circle = thisClass._$circle[0];

                // Set the radius & fill
                circle.setAttribute("r", thisClass.get("radius"));
                circle.setAttribute("fill", thisClass.get("color"));
                circle.setAttribute("stroke", thisClass.get("stroke"));
                circle.setAttribute("stroke-width", thisClass.get("strokewidth"));

                // Capture all mouse events
                circle.setAttribute("pointer-events", "all");

                // Add classes
                if(thisClass.has("class")){
                    circle.setAttribute("class", thisClass.get("class").join(" "));
                }

                var el = thisClass.elem()[0];
                if(thisClass.has("transform")){
                    var transform = thisClass.get("transform");
                    var x = (typeof transform.x !== 'undefined' && typeof transform.x !== null) ? transform.x : 0;
                    var y = (typeof transform.y !== 'undefined' && typeof transform.y !== null) ? transform.y : 0;
                    var scale = (typeof transform.scale !== 'undefined' && typeof transform.scale !== null) ? transform.scale : 1.0;
                    
                    /*if(thisClass._previous.hasOwnProperty("transform")){
                        thisClass.animate(el, {transform: {scale: scale, x:x, y:y}}, 500, 100);
                    }else{*/
                        el.setAttribute("transform", "scale("+scale+" "+scale+") translate(" + x + " " + y + ")");
                    //}
                }
                el.setAttribute("id", "node-" + thisClass.id);
                
                // Set text properties
                if(thisClass.has("svgText")){
                    thisClass.get("svgText").set("radius", thisClass.get("radius"));
                    thisClass.get("svgText").set("text", thisClass.get("text"));
                    thisClass.get("svgText").set("font", thisClass.get("font"));
                    if(thisClass.has("minfontsize")){
                        thisClass.get("svgText").set("minfontsize", thisClass.get("minfontsize"));
                    }
                }
            

                if(thisClass._utility.text !== null){
                    // Draw text
                    thisClass.get("svgText").draw();
                }else if(!pvt.textRenderNotificationSent){
                    pvt.textRenderNotificationSent = true;
                    console.warn("no text manager defined. ignoring text render.")
                }
            }
        }
    }
    
    
    pvt.drawCircle = function(xc, yc, x, y){
        var points = [];
        points.push({x: xc+x, y: yc+y});
        points.push({x: xc+x, y: yc-y});
        points.push({x: xc-x, y: yc+y});
        points.push({x: xc-x, y: yc-y});
        points.push({x: xc+y, y: yc+x});
        points.push({x: xc+y, y: yc-x});
        points.push({x: xc-y, y: yc+x});
        points.push({x: xc-y, y: yc-x});
        return points;
    };
    
    /**
     * Get an arc from a full circle
     * @param {number} smooth - how smooth the edge should be. 1 = not smooth, 1000 = very smooth
     * @param {type} r - the final radius of the arc
     * @param {number[]} segments - the segments to keep (0-7). Returns all segments if nothing provided.
     * @return {string} - the svg arc
     */
    pvt.getArc = function(smooth, r, segments){
        var x = 0;
        var b = smooth;
        var y = b;
        var d = 3 - 2*r;

        var sets = [];
        while(y >= x){
            sets.push(pvt.drawCircle(0,0,x,y));
            x++;

            if(d > 0){
                y--;
                d = d + 4 * (x-y) + 10;
            }else{
                d = d + (4 * x) + 6;
                sets.push(pvt.drawCircle(0,0,x,y));
            }
        }
        
        var arcs = [];
        var arcOrder = [1,-5,4,0,2,-6,7,-3];
        
        segments = (!segments) ? [0,1,2,3,4,5,6,7] : segments;
        
        
        for(var q = 0; q < segments.length; q++){
            var i = segments[q];
            var arc = [];
            if(arcOrder[i] > 0){
                sets.forEach(function(set){
                    arc.push(r*set[arcOrder[i]].x/b + "," + r*set[arcOrder[i]].y/b);
                });
            }else{
                arcOrder[i] = -arcOrder[i];
                sets.forEach(function(set){
                    arc.unshift(r*set[arcOrder[i]].x/b + "," + r*set[arcOrder[i]].y/b);
                });
            }
            
            arcs.push(arc.join(" "));
        }
        return arcs.join(" ");
    };
    
    return SvgNode;
});