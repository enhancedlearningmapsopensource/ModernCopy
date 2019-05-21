/**
 * Encapsulates the graph object
 */
define(["jquery","jsclass!3rdParty/jsclass/", "./elem"],
function($, JsClass, SvgElement){
    var pvt = {
        consts: {
            FONT_SIZE_MAX: 20,
            FONT_SIZE_MIN: 8
        }
    };

    class SvgNodeText extends SvgElement{
        /**
         * Constructor for the SvgNodeText object 
         * @param {number} id - the id of the node
         * @param {Object} options
         * @param {TextManager} options.text - text manager (@see svg/text-manager/text-manager.js)
         * @param {HandlerSet} options.handlers - event handlers
         * @param {object[]} options.overrides - function overrides
         */
        constructor(id, options){
            super(id, "SvgNodeText");
            
            assertDefined(options.text);

            var thisClass = this;
            thisClass.name = "SvgNodeText";
            
            // Verify handler type
            if(options.handlers){
                assertType(options.handlers, "HandlerSet");
            }
            
            // Save text manager
            thisClass._utility = {};
            thisClass._utility.text = options.text;
            
            // Save handlers (just in case)
            thisClass._handlers = options.handlers;
            
            // Save any overridden functions
            thisClass._overrides = options.overrides;
            
            // Create an element to hold the svg parts
            thisClass._$el = $(document.createElementNS("http://www.w3.org/2000/svg", "g"));
            
            // Set common attributes
            thisClass._$el[0].setAttribute("pointer-events", "none");   // Change cursor on hover
            thisClass._$el[0].setAttribute("class", "unselectable");    // Don't allow text to be drag selected
        }
        
        default(){
            return{
                textLines: [],
                tspans: []
            };
        }
        
        _draw(){
            var thisClass = this;
            
            // If something has changed about the node text then redraw it
            if(thisClass.changed()){
                var el = thisClass._$el[0];
                
                // Validate
                assert(thisClass.has("font"));
                assert(thisClass.has("text"));
                assert(thisClass.has("radius"));
                
                // Fit the text to the node
                var textManager = thisClass._utility.text;
                var nodeText = thisClass.get("text");
                var nodeRadius = thisClass.get("radius");
                
                // Get the minimum font size
                var minFontSize = pvt.consts.FONT_SIZE_MIN;
                if(thisClass.has("minfontsize") && thisClass.get("minfontsize") !== null){
                    var minFontSize = thisClass.get("minfontsize");
                }
                
                if(typeof minFontSize === "string"){
                    minFontSize = Number(minFontSize.split("pt")[0]);
                }
                
                var fitOptions = {
                    family: thisClass.get("font"),  // Font family
                    fontRange: {min: minFontSize, max: pvt.consts.FONT_SIZE_MAX},   // Font size range
                    center: true
                };
                
                // Use the text manager to map the text
                var textMap = textManager.fitText(nodeText, nodeRadius, fitOptions);
                var numLines = textMap.length;
                var fontSize = textMap.fontSize();
                
                // Get the svg text elements
                var textLines = thisClass.get("textLines");
                
                // Get the old tspan elements
                var tspans = thisClass.get("tspans");
                
                // If there are more lines than necessary then remove a few
                while(textLines.length > numLines){
                    // Remove text element from the svg (no reuse)
                    var lastSpan = textLines.pop();
                    $(lastSpan).unbind();
                    $(lastSpan).remove();
                }
                
                // If there are fewer lines than necessary then add 
                while(textLines.length < numLines){
                    var textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    textEl.setAttribute("x", "0");
                    textEl.setAttribute("y", "0");
                    textEl.setAttribute("text-anchor", "middle");
                    textEl.setAttribute("alignment-baseline", "middle");
                    
                    textLines.push(textEl);
                    el.appendChild(textEl);
                }
                
                // Clean out the text (tspans) from the lines
                tspans.forEach(function(span){
                    $(span).unbind();
                    $(span).remove();
                });
                
                
                thisClass._$el[0].setAttribute("font-family", thisClass.get("font"));
                
                var currText = null;
                textMap.forEach(function(line, lineIndex){
                    currText = textLines[lineIndex];
                    el.appendChild(currText);
                    currText.setAttribute("transform", "translate(0 "+line.y+")");
                    currText.setAttribute("font-size", fontSize + "px");
                    
                    if(!line.isItalic()){
                        var tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
                        currText.appendChild(tspan);
                        tspan.textContent = line.text();
                        tspan.setAttribute("alignment-baseline", "middle");
                        
                        // Save the tspan reference
                        tspans.push(tspan);
                    }else{
                        var words = [];
                        for(var wordIndex = 0; wordIndex < line.length; wordIndex++){
                            words.push(line.at(wordIndex));
                        }
                        
                        var areAllItalic = words.reduce(function(acc,val){
                            return (acc && val.italic);
                        }, true);
                        
                        if(!areAllItalic){
                            // Add a space to all but the last word
                            var spacedWords = [];
                            for(var i = 0; i < words.length - 1; i++){
                                spacedWords.push({text: words[i].text + " ", italic: words[i].italic});
                            }
                            spacedWords.push({text: words[words.length - 1].text, italic: words[words.length - 1].italic});
                            spacedWords.forEach(function(sw){
                                var tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
                                currText.appendChild(tspan);
                                tspan.textContent = sw.text;
                                tspan.setAttribute("alignment-baseline", "middle");
                                if(sw.italic){
                                    tspan.setAttribute("font-style", "italic");
                                }
                                
                                // Save the tspan reference
                                tspans.push(tspan);
                            });
                        }else{
                            var str = words.reduce(function(acc,val){
                                return acc.concat(val.text);
                            },[]);


                            var tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
                            currText.appendChild(tspan);
                            tspan.textContent = str.join(" ");
                            tspan.setAttribute("alignment-baseline", "middle");
                            tspan.setAttribute("font-style", "italic");
                            
                            // Save the tspan
                            tspans.push(tspan);
                        }
                    }
                });
            }
        }
    }
    return SvgNodeText;
});