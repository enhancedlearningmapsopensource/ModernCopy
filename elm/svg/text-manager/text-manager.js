
/**
 * 
 * @typedef {Object} Word
 * @property {string} word - the original word
 * @property {number} width - the width of each character in the word
 * @property {height} height - the height of each character in the word
 * @property {boolean} italic - indicates an italicized word
 * 
 * @typedef {Word[]} Line
 */

define([
    "./word", 
    "./line",
    "./line-set",
    "enforced"
],function (
    Word, 
    Line,
    LineSet,
    Enforced
) {

    var pvt = {};

    class GraphNodeTextManager extends Enforced {
        constructor() {
            super("GraphNodeTextManager");
        }

        load(font){
            var thisClass = this;
        }
        
        /**
         * Fit the text to the circle
         * @param {type} str - string to fit
         * @param {number} radius - circle radius
         * @param {Object} options
         * @param {string} options.allowCenter - allows the text to be centered
         * @param {string} options.family - the font family to use
         * @param {Object} options.fontRange - the allowable font size range
         * @param {number} options.fontRange.min - the lower limit on the font size
         * @param {number} options.fontRange.max - the upper limit on the font size
         * @returns {LineSet}
         */
        fitText(str, radius, options){
            var lineSet = null;
            if(str.trim().length > 0){
                // Validate options
                assertDefined(options);
                assertType(options.family, "string");
                assertType(options.fontRange.min, "number");
                assertType(options.fontRange.max, "number");

                // Set up the output lines
                lineSet = new LineSet();

                // Convert the given string to words
                pvt.stringToWords(str).map(function(w){
                    // Use the object to create a class instance
                    return new Word({
                        text: w.word,
                        italic: w.italic 
                    });
                }).forEach(function(w){
                    // Add word to line set
                    lineSet.addWord(w);
                });

                // Fit the given words to a circle
                lineSet.fitToCircle({
                    radius: radius,
                    family: options.family,
                    "font-range": options.fontRange,
                    center: options.center
                });
            }else{
                lineSet = new LineSet();
                //lineSet = JSON.parse('{"_enforcedType":"LineSet","_lineDictionary":[],"_fontSize":71,"_lines":[{"_width":null,"_height":null,"_words":[{"text":"...","x":0,"y":0,"width":0,"height":0,"italic":false}],"x":0,"y":0,"font-size":71,"font-family":"Trebuchet, Helvetica, Arial, sans-serif","_dictionary":null}],"_words":[{"text":"...","x":0,"y":0,"width":0,"height":0,"italic":false}],"x":0,"y":0}')
            }
            
            assertDefined(lineSet);
            return lineSet;
        }
    }    

    pvt.distillISets = function(text){
        if(typeof text !== "string"){
            return text;
        }

        var regExp = /^(.*?)\s\[i\](.*?)\[\/i\]\s(.*?)$/;


        var found = (" " + text.trim() + " ").match(regExp);

        if(found !== null){
            
            found.shift();
            var preTag = pvt.distillISets(found[0].trim()).trim();
            var taggedString = pvt.distillISets(found[1].trim()).trim();
            var postTag = pvt.distillISets(found[2].trim()).trim();

            var taggedWords = taggedString.split(/[\s]+/g).map(function(d){
                return "[i]" + d.trim() + "[/i]";
            }).join(" ");

            text = [preTag, taggedWords, postTag].join(" ");
            return text.trim();
        }else{
            return text.replace("[i]","").replace("[/i]","").trim();
        }
        
    };
    
    /**
     * @param {string} text - string to parse
     * @return {Word[]} - list of words (@see svg/text-manager/word.js)
     */
    pvt.stringToWords = function(text){
        // Validate input
        assertType(text, "string");
        
        var distilledText = pvt.distillISets(text);
        var words = distilledText.split(/[\s]+/g);
        var tagMatch = /^\[i\](.*?)\[\/i\]$/i;

        words = words.map(function (d) {
            var found = d.match(tagMatch);
            if(found){
                d = found[1];
            }
            return { word: d, /*width: [], height: [],*/ italic: (found ? true : false) };
        });
        
        return assertType(words, "object[]");
    };

    return GraphNodeTextManager;
});