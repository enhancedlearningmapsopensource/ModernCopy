/* 
 * Word object
 */
define([],function(){
    return class Word{
        constructor(options){
            var thisClass = this;
            
            options = (!options) ? {} : options;
            
            // Define parameters
            thisClass.text = (options.text) ? options.text : "";
            thisClass.x = (options.x) ? options.x : 0;
            thisClass.y = (options.y) ? options.y : 0;
            thisClass.width = (options.width) ? options.width : 0;
            thisClass.height = (options.height) ? options.height : 0; 
            thisClass.italic = (options.italic) ? options.italic : false;
        }
        
        /**
         * Copy the current word
         * @returns {Word}
         */
        copy(){
            var thisClass = this;
            return new Word({
                text: thisClass.text,
                x: thisClass.x,
                y: thisClass.y,
                width: thisClass.width,
                height: thisClass.height,
                italic: thisClass.italic
            }); 
        }
    };
});