/* 
 * Line object
 */
define(["./dimension-dictionary"],function(DimensionDictionary){
    var pvt = {};
    
    class Line{
        constructor(options){
            var thisClass = this;
            
            // Ensure options
            options = (!options) ? {} : options;
            
            // Unsettable
            thisClass._width = null;
            thisClass._height = null;
            
            // Define parameters
            var params = {
                _words: [],
                x: 0,
                y: 0,
                "font-size": 0,
                "font-family": null,
                _dictionary: null
            };
            
            // Match to options
            Object.keys(params).forEach(function(k){
                
                if(options[k]){
                    thisClass[k] = options[k];
                }else if(k.substring(0,1) == "_"){
                    var split = k.substring(1,k.length);
                    if(options[split]){
                        thisClass[k] = options[split];
                    }else{
                        thisClass[k] = params[k];
                    }
                }else{
                    thisClass[k] = params[k];
                }
            });
            
            Object.defineProperty(thisClass, "length", {
                get: function () {
                    return thisClass._words.length;
                }
            });
        }
        
        /**
         * Adds a word
         * @param {Word} word - word
         */
        addWord(word){
            var thisClass = this;
            assertType(word, "object");
            thisClass._words.push(word);
            thisClass._width = null;
            thisClass._height = null;
        }
        
        /**
         * Gets the area taken up by the line
         * @returns {number} - the area taken by the line
         */
        area(){
            var thisClass = this;
            return thisClass.width()*thisClass.height();
        }
        
        /**
         * Gets the word at the given index
         * @param {number} index - word index
         * @returns {Word} - word at the given index
         */
        at(index){
            return this._words[index];
        }
        
        /**
         * Gets the line height
         * @returns {number} - the height of the line
         */
        height(){
            var thisClass = this;
            var dimOptions = {
                size: thisClass["font-size"], 
                family: thisClass["font-family"]
            };

            // Get the height
            var height = pvt.determineStringDim(thisClass.text(), dimOptions, "height");
            assertType(height, "number");
            
            return height;
        }
        
        /**
         * Indicates whether the line contains any words that are itallic
         * @returns {boolean}
         */
        isItalic(){
            var thisClass = this;
            return (typeof (thisClass._words.find(function(d){
                return d.italic;
            })) !== 'undefined');
        }
        
        /**
         * Remove the last word
         * @returns {Word} - the removed word
         */
        removeLast(){
            return this._words.pop();
        }
        
        /**
         * Gets the line text
         * @returns {string} - the combined text of words separated by spaces
         */
        text(){
            return this._words.map(function(d){
                return d.text;
            }).join(" ");
        }
        
        /**
         * Gets the line width
         * @returns {number} - the width of the line
         */
        width(){
            var thisClass = this;
            
            // Shorten
            var f = thisClass["font-family"],
                s = thisClass["font-size"],
                t = thisClass.text();
            
            // Check dictionary
            if(DimensionDictionary.has(f, s, t, "width")){
                return DimensionDictionary.get(f, s, t, "width", width);
            }
            
            var dimOptions = {
                size: thisClass["font-size"], 
                family: thisClass["font-family"]
            };

            // Get the height
            var width = pvt.determineStringDim(thisClass.text(), dimOptions, "width");
            assertType(width, "number");
            
            DimensionDictionary.add(f, s, t, "width", width);
            
            return width;
        }
    };
    
    
    /** 
     * Determine the given dimension (width or height) of the string
     * @param {string} str - string to find width of
     * @param {Object} font
     * @param {string} font.family - the font family to use
     * @param {number} font.size - the size of the font (in px)
     * @param {string} dim - the dimension (width|height)
     * @returns {number} - the requested dimension of the string
     */
    pvt.determineStringDim = function(str, font, dim){
        // Create an svg element
        var svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        $("body")[0].appendChild(svgEl);
        
        // Add the sizer text
        var sizerText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        svgEl.appendChild(sizerText);
        
        // Add the sizer tspan
        var sizerTspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        sizerText.appendChild(sizerTspan);
        sizerTspan.setAttribute("font-size", font.size + "px");
        sizerTspan.setAttribute("font-family", font.family);
        sizerTspan.textContent = str;
        
        var rect = sizerText.getBoundingClientRect();
        
        // Remove tspan
        sizerText.removeChild(sizerTspan);
        svgEl.removeChild(sizerText);
        $("body")[0].removeChild(svgEl);
        
        //sizerText.setAttribute("display","none");
        return (rect[dim]);
    };
    
    return Line;
});

