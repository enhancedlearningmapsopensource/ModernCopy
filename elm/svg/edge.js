/**
 * Encapsulates the edge object
 */

/**
 * @typedef {Object} Vec2
 * @property {number} x - x coord
 * @property {number} y - y coord
 * 
 * @typedef {Object} EdgeOb
 * @property {int} sourceNode - the source node id
 * @property {int} targetNode - the target node id
 * @property {Vec2[]} midpoints - the points to pass edge through
 */

define(["jquery","jsclass!3rdParty/jsclass/", "./elem-mouse"],
function($, JsClass, SvgMouseElement){
    var pvt = {};

    class SvgEdge extends SvgMouseElement{
        constructor(id, options, d){
            super(id, options, "edge");

            var thisClass = this;
            thisClass.name = "SvgEdge";
            thisClass._$el = $(document.createElementNS("http://www.w3.org/2000/svg", "g"));
            
            thisClass._$primary = $(document.createElementNS("http://www.w3.org/2000/svg", "path"));
            thisClass.elem()[0].appendChild(thisClass._$primary[0]);
            thisClass._$primary[0].setAttribute("pointer-events", "none");
            thisClass._$primary[0].setAttribute("fill", "none");
            
            thisClass._$secondary = $(document.createElementNS("http://www.w3.org/2000/svg", "path"));
            thisClass.elem()[0].appendChild(thisClass._$secondary[0]);
            thisClass._$secondary[0].setAttribute("pointer-events", "visiblePainted");
            thisClass._$secondary[0].setAttribute("stroke-width", "16px");
            thisClass._$secondary[0].setAttribute("fill", "none");
            thisClass._$secondary[0].setAttribute("stroke", "#000");
            thisClass._$secondary[0].setAttribute("opacity", "0.01");
            thisClass._$secondary[0].setAttribute("s", d.src);
            thisClass._$secondary[0].setAttribute("t", d.tgt);
            
            var g = thisClass._$el;
            thisClass._$el = thisClass._$secondary;
            thisClass.postInit();
            thisClass._$el = g;
        }
        
        _draw(){
            var thisClass = this;

            var path = thisClass.get("path");
            assertDefined(path);
            
            // Set up primary connection
            var primary = thisClass._$primary[0];            
            primary.setAttribute("d", path);
            primary.setAttribute("fill", "transparent");
            primary.setAttribute("stroke", "#000");
            primary.setAttribute("stroke-width", "1px");
            primary.setAttribute("marker-end", "url(#arrow)");
            if(!thisClass.get("dir")){
                primary.setAttribute("stroke-dasharray", "3, 3");
            }
            
            // Set up secondary connection
            var secondary = thisClass._$secondary[0];            
            secondary.setAttribute("d", path);
        }
    }
    return SvgEdge;
});