/* 
 * Line object
 */
define(["enforced","jsclass!3rdParty/jsclass/"],function(Enforced,JsClass){
    var pvt = {
        consts: {
            DIM_MAP: {
                width: 0,
                height: 1
            }
        }
    };
    
    class DimensionDictionary extends Enforced{
        constructor(options){
            super("DimensionDictionary");
            var thisClass = this;
            
            thisClass._data = new JsClass.Hash();
        }
        
        /**
         * Add a new dimension record
         * @param {string} font - the font family
         * @param {number} size - the font size
         * @param {string} text - the text
         * @param {string} dim - (width|height)
         * @param {number} val - the dimension amount
         */
        add(font, size, text, dim, val){
            var thisClass = this;
            assertType(font, "string");
            assertType(size, "number");
            assertType(text, "string");
            assertType(dim, "string");
            assertType(val, "number");
            
            var dims = pvt.getText.call(thisClass, font, text, size);
            dims[pvt.consts.DIM_MAP[dim]] = val;
        }
        
        /**
         * Get the dimension
         * @param {string} font - the font family
         * @param {number} size - the font size
         * @param {string} text - the text
         * @param {string} dim - (width|height)
         * @returns {number} - the dimension
         */
        get(font, size, text, dim){
            var thisClass = this;
            assertType(font, "string");
            assertType(size, "number");
            assertType(text, "string");
            assertType(dim, "string");
            
            var dims = pvt.getText.call(thisClass, font, text, size);
            return dims[pvt.consts.DIM_MAP[dim]];
        }
        
        /**
         * Determine whether the dictionary knows the dimension
         * @param {string} font - the font family
         * @param {number} size - the font size
         * @param {string} text - the text
         * @param {string} dim - (width|height)
         * @returns {boolean} - true if the dimension is known, otherwise false
         */
        has(font, size, text, dim){
            var thisClass = this;
            assertType(font, "string");
            assertType(size, "number");
            assertType(text, "string");
            assertType(dim, "string");
            
            if(thisClass._data.hasKey(font)){
                var fontDic = pvt.getFont.call(thisClass, font);
                if(fontDic.hasKey(text)){
                    var textDic = fontDic.fetch(text);
                    if(textDic.hasKey(size)){
                        var sizeDic = textDic.fetch(size);
                        return (sizeDic[pvt.consts.DIM_MAP[dim]] !== null);
                    }
                }
            }
            
            return false;
        }
    };
    
    /**
     * Get the font
     * @param {string} font
     * @returns {JsClass.Hash} - the font
     */
    pvt.getFont = function(font){
        var thisClass = this;
        if(!thisClass._data.hasKey(font)){
            thisClass._data.store(font, new JsClass.Hash());
        }
        return thisClass._data.fetch(font);
    };
    
    
    /**
     * Get the font size
     * @param {number} size
     * @returns {JsClass.Hash} - the size
     */
    pvt.getDimensions = function(font, text, size){
        var thisClass = this;
        var text = pvt.getText.call(thisClass, font, text);
        if(!text.hasKey(size)){
            text.store(size, [null, null]);
        }
        return text.fetch(size);
    };
    
    /**
     * Get the font size
     * @param {number} size
     * @returns {JsClass.Hash} - the size
     */
    pvt.getText = function(font, text){
        var thisClass = this;
        var font = pvt.getFont.call(thisClass, font);
        
        if(!font.hasKey(text)){
            font.store(text, new JsClass.Hash());
        }
        return font.fetch(text);
    };
    
    return new DimensionDictionary();
});

