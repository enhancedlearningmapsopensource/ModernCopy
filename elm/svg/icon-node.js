/**
 * Encapsulates the graph object
 */
define(["jquery","jsclass!3rdParty/jsclass/", "./node", "./icon"],
function($, JsClass, SvgNode, SvgIcon){
    var pvt = {};

    class SvgIconNode extends SvgNode{
        constructor(id, options){
            
            super(id, options);
            var thisClass = this;
            
            //thisClass.set("iconclickhandler", iconClickHandler);
            
            // Create, save, and listen to text
            
            //thisClass._$el[0].appendChild(text.elem()[0]);
            //thisClass.listenForChange("text", thisClass.textChanged);
            //thisClass.listenForChange("radius", thisClass.radiusChanged);
            
            //<polygon points="-5,-15 5,-15 5,-5 15,-5 15,5 5,5 5,15 -5,15 -5,5 -15,5 -15,-5 -5,-5 -5,-15" transform="translate(0 -50)" class="circle-icon plus parent-plus"></polygon>
        }
        
        default(){
            var parentDefault = super.default();
            parentDefault["icon-stroke-width"] = "2px";
            parentDefault["icon-stroke"] = "rgb(0, 0, 0)";
            parentDefault["icon-fill"] = "rgb(51, 255, 255)";
            return parentDefault;
        }
        
        _draw(){
            var thisClass = this;
            super._draw();
            
            if(thisClass.has("class")){
                var hasShowIconClass = thisClass.get("class").find(function(d){
                    return (d === "showicons");
                });
                
                if(typeof hasShowIconClass !== 'undefined'){
                    pvt.hideIcons.call(thisClass);
                    pvt.showIcons.call(thisClass);
                }else{
                    pvt.hideIcons.call(thisClass);
                }
            }else{
                pvt.hideIcons.call(thisClass);
            }
        }
    }
    
    pvt.showIcons = function(){
        var thisClass = this;
        var iconOptions = {handlers: thisClass._handlers, overrides: thisClass._overrides};
        
        if(thisClass.id === 1830){
            var k = 0;
        }
        
        // Create parent/child plus signs
        var relatives = [];
        if(thisClass.get("hasParents") === true){
            relatives.push("parent");
        }
        if(thisClass.get("hasChildren") === true){
            relatives.push("child");
        }
        relatives.forEach(function(rel){
            // Create the plus
            if(!thisClass.has(rel)){
                thisClass.set(rel, new SvgIcon(thisClass.id, iconOptions));//$(document.createElementNS("http://www.w3.org/2000/svg", "polygon")));
                thisClass.get(rel).set("points", "-5,-15 5,-15 5,-5 15,-5 15,5 5,5 5,15 -5,15 -5,5 -15,5 -15,-5 -5,-5 -5,-15");
                thisClass.get(rel).set("class", ["svg-icon", "svg-plus", rel + "-svg-plus"]);
                thisClass.get(rel).set("stroke", thisClass.get("icon-stroke"));
                thisClass.get(rel).set("stroke-width", thisClass.get("icon-stroke-width"));
                thisClass.get(rel).set("fill", thisClass.get("icon-fill"));
            }
        });
        
        // Create the hourglass
        if(!thisClass.has("hourglass")){
            thisClass.set("hourglass", new SvgIcon(thisClass.id, iconOptions));//$(document.createElementNS("http://www.w3.org/2000/svg", "polygon")));
            thisClass.get("hourglass").set("points", "-15,-20 15,-20 3,0 15,20 -15,20 -3,0 -15,-20");
            thisClass.get("hourglass").set("class", ["svg-icon", "svg-hourglass"]);
            thisClass.get("hourglass").set("stroke", thisClass.get("icon-stroke"));
            thisClass.get("hourglass").set("stroke-width", thisClass.get("icon-stroke-width"));
            thisClass.get("hourglass").set("fill", thisClass.get("icon-fill"));
        }
        
        // Set the transform of the parent plus and add icon to el
        if(thisClass.get("hasParents") === true){
            thisClass.get("parent").set("transform", "translate(0 -"+thisClass.get("radius")+")");
            thisClass.elem()[0].appendChild(thisClass.get("parent").elem()[0]);
            
            // Draw
            thisClass.get("parent").draw();
        }
        
        // Set the transform of the child plus and add icon to el
        if(thisClass.get("hasChildren") === true){
            thisClass.get("child").set("transform", "translate(0 "+thisClass.get("radius")+")");
            thisClass.elem()[0].appendChild(thisClass.get("child").elem()[0]);
            
            // Draw
            thisClass.get("child").draw();
        }
        
        // Set the transform of the hourglass and add icon to el
        thisClass.get("hourglass").set("transform", "translate("+thisClass.get("radius")+" 0)");
        thisClass.elem()[0].appendChild(thisClass.get("hourglass").elem()[0]);
        
        // Draw
        thisClass.get("hourglass").draw();
    };
    
    pvt.hideIcons = function(){
        var thisClass = this;
        ["parent", "child", "hourglass"].forEach(function(rel){
            // Remove icon
            if(thisClass.has(rel)){
                var icon = thisClass.get(rel);
                var $iconEl = icon.elem();
                $iconEl.unbind();
                $iconEl.remove();
            }
        });
    };
    return SvgIconNode;
});