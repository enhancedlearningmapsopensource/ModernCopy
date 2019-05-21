/**
 * Encapsulates the graph object
 */
define(["jquery","jsclass!3rdParty/jsclass/", "./elem-mouse"],
function($, JsClass, SvgMouseElement){
    var pvt = {};

    class SvgIcon extends SvgMouseElement{
        constructor(id, options){
            
            super(id, options, "icon");
            var thisClass = this;
            
            // Configure options
            options = (!options) ? {} : options;
            thisClass._handlers = (!options.handlers) ? null : options.handlers;
            thisClass._overrides = (!options.overrides) ? null : options.overrides;
            
            thisClass._$el = $(document.createElementNS("http://www.w3.org/2000/svg", "polygon"));
            
            thisClass.postInit();
            
            // Create, save, and listen to text
            
            //thisClass._$el[0].appendChild(text.elem()[0]);
            //thisClass.listenForChange("text", thisClass.textChanged);
            //thisClass.listenForChange("radius", thisClass.radiusChanged);
            
            //<polygon points="-5,-15 5,-15 5,-5 15,-5 15,5 5,5 5,15 -5,15 -5,5 -15,5 -15,-5 -5,-5 -5,-15" transform="translate(0 -50)" class="circle-icon plus parent-plus"></polygon>
        }
        
        _draw(){
            var thisClass = this;
            thisClass.elem()[0].setAttribute("points", thisClass.get("points"));
            thisClass.elem()[0].setAttribute("class", thisClass.get("class").join(" "));
            thisClass.elem()[0].setAttribute("transform", thisClass.get("transform"));
            thisClass.elem()[0].setAttribute("stroke", thisClass.get("stroke"));
            thisClass.elem()[0].setAttribute("stroke-width", thisClass.get("stroke-width"));
            thisClass.elem()[0].setAttribute("fill", thisClass.get("fill"));
            
        }
    }
    
    pvt.showIcons = function(){
        var thisClass = this;
        
        // Create the parent plus
        if(!thisClass.has("parent")){
            thisClass.set("parent", $(document.createElementNS("http://www.w3.org/2000/svg", "polygon")));
            thisClass.get("parent")[0].setAttribute("points", "-5,-15 5,-15 5,-5 15,-5 15,5 5,5 5,15 -5,15 -5,5 -15,5 -15,-5 -5,-5 -5,-15");
            thisClass.get("parent")[0].setAttribute("class", "circle-icon plus parent-plus");
            thisClass.get("parent")[0].setAttribute("stroke-width", "2px");
            thisClass.get("parent")[0].setAttribute("stroke","#000");
            thisClass.get("parent")[0].setAttribute("fill", "#3FF");
        }
        
        // Set the transform of the parent plus
        thisClass.get("parent")[0].setAttribute("transform", "translate(0 -"+thisClass.get("radius")+")");
        
        // Add icon to el
        thisClass.elem()[0].appendChild(thisClass.get("parent")[0]);
        
        // Bind click event
        
        
        // Create the child plus
        if(!thisClass.has("child")){
            thisClass.set("child", $(document.createElementNS("http://www.w3.org/2000/svg", "polygon")));
            thisClass.get("child")[0].setAttribute("points", "-5,-15 5,-15 5,-5 15,-5 15,5 5,5 5,15 -5,15 -5,5 -15,5 -15,-5 -5,-5 -5,-15");
            thisClass.get("child")[0].setAttribute("class", "circle-icon plus child-plus");
            thisClass.get("parent")[0].setAttribute("stroke-width", "2px");
            thisClass.get("parent")[0].setAttribute("stroke","#000");
            thisClass.get("parent")[0].setAttribute("fill", "#3FF");
        }
        
        // Set the transform of the parent plus
        thisClass.get("child")[0].setAttribute("transform", "translate(0 "+thisClass.get("radius")+")");
        
        // Add icon to el
        thisClass.elem()[0].appendChild(thisClass.get("child")[0]);
        
        // Create the hourglass
        if(!thisClass.has("hourglass")){
            thisClass.set("hourglass", $(document.createElementNS("http://www.w3.org/2000/svg", "polygon")));
            thisClass.get("hourglass")[0].setAttribute("points", "-15,-20 15,-20 3,0 15,20 -15,20 -3,0 -15,-20");
            thisClass.get("hourglass")[0].setAttribute("class", "circle-icon hourglass");
            thisClass.get("parent")[0].setAttribute("stroke-width", "2px");
            thisClass.get("parent")[0].setAttribute("stroke","#000");
            thisClass.get("parent")[0].setAttribute("fill", "#3FF");
        }
        
        // Set the transform of the parent plus
        thisClass.get("hourglass")[0].setAttribute("transform", "translate("+thisClass.get("radius")+" 0)");
        
        // Add icon to el
        thisClass.elem()[0].appendChild(thisClass.get("hourglass")[0]);
    };
    
    pvt.hideIcons = function(){
        
    };
    return SvgIcon;
});