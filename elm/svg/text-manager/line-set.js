/* 
 * Line object
 */
define(["./line", "jsclass!3rdParty/jsclass/", "./word", "enforced"],function(Line, JsClass, Word, Enforced){
    var pvt = {};
    
    class LineSet extends Enforced{
        constructor(options){
            super("LineSet");
            var thisClass = this;
            
            // Ensure options
            options = (!options) ? {} : options;
            
            // Unsettable 
            // @type {object[]}
            thisClass._lineDictionary = [];
            thisClass._fontSize = null;
            
            // Define parameters
            var params = {
                _lines: [],
                _words: [],
                //_pairs: {},
                x: 0,
                y: 0
            };
            
            // Check for global alternatives
            if(typeof window.globalPairs === 'undefined'){
                window.globalPairs = {};
            }
            
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
                    return thisClass._lines.length;
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
        }
        
        /**
         * @param {Object} options 
         * @param {number} options.radius - circle radius
         * @param {string} options.family - font family
         * @param {Object} font-range - the allowable font size range
         * @param {number} font-range.min - the lower limit on the font size
         * @param {number} font-range.max - the upper limit on the font size
         * @returns {boolean} - true if the fit was successfull, otherwise false
         */
        fitToCircle(options){
            var thisClass = this;
            
            assertDefined(options);
            assertType(options.radius, "number");
            assertType(options.family, "string");
            assertType(options["font-range"], "object");
            
            // Shortcuts
            var radius = options.radius;
            var family = options.family;
            var range = options["font-range"];
            var center = (typeof options.center === 'undefined') ? false : options.center;
            options = null;
                         
            var log = null; 
            var fitFound = false;
            var fitOptions = {log: log, center: center};
            for(var fontSize = range.max; fontSize >= range.min; fontSize--){
                if(thisClass.fitToCircleAtSize(radius, family, fontSize, fitOptions)){
                    fitFound = true;
                    break;
                }
            }
            
            
            // No match possible on the string
            if(!fitFound){
                // Remove a word at a time until the text fits at the smallest size
                var safety = 1000;
                while(!fitFound){
                    if((safety--) < 0){ throw Error("safety"); }

                    // Ellipse the last word
                    pvt.ellipse.call(thisClass);

                    // Try fit to smallest font
                    fitFound = thisClass.fitToCircleAtSize(radius, family, range.min, fitOptions);
                }
                
                // So we've ellipsed enough words that they all fit at the minimum size. Now increase the
                // size slowly until we reach the maximum allowable size for the ellipsed string.
                var currFontSize = range.min;
                safety = 1000;
                while(fitFound){
                    if((safety--) < 0){ throw Error("safety"); }
                    
                    currFontSize++;
                    fitFound = thisClass.fitToCircleAtSize(radius, family, currFontSize, fitOptions);
                }
                
                // Reduce size by one and run once to latch values
                currFontSize--;
                assert(thisClass.fitToCircleAtSize(radius, family, currFontSize, fitOptions));
            }
            
            // Write the log if it was used
            if(log !== null){
                console.log(log.join("\n"));
            }
            return fitFound;
        }
        
        /**
         * Fit words to circle
         * @param {number} radius - the circle radius
         * @param {string} family - the font family to use
         * @param {number} size - the font size to use
         * @param {object} options
         * @param {number=null} options.maxWords - the max # of words allowed on the first line
         * @param {string[]=null} options.log - the action log
         * @param {boolean=false} options.center - indicates whether the words should be centered
         * @returns {Boolean} - true if the fit was successfull, otherwise false
         */
        fitToCircleAtSize(radius, family, size, options){
            var thisClass = this;
            assertType(radius, "number");
            assertType(family, "string");
            assertType(size, "number");
            assertType(options, "object");
            
            var log = (!options.log) ? null : options.log;
            var maxWords = (!options.maxWords) ? null : options.maxWords;
            var center =  (typeof options.center === 'undefined') ? false : options.center;
            
            // Clear lines
            thisClass._lines = [];
            
            // Exit conditions
            // 1. (TRUE) All words are placed AND all lines fit
            // 2. (FALSE) Sum of line height is > 2*R
            // 3. (FALSE) A line is left blank while words still exist
            // 4. (ERROR) Safety failse
            
            // Log current attempt
            if(log !== null){
                log.push("line-set::fitToCircleAtSize - testing (r: "+radius+", family: "+family+", size: " + size + ")");
            }
            
            // Copy words
            var wordStack = thisClass._words.map(function(d){
                return d.copy();
            });
                        
            // Check word count
            var safety = 1000;
            while(wordStack.length > 0){
                
                // Check safety
                if((safety--) < 0){ throw Error("safety failed"); }
                
                // Check for existing lines
                if(thisClass._lines.length == 0){
                    pvt.addLine.call(thisClass, size, family);
                }
                
                // Add the next word to the last line (and remove it from the stack)
                var nextWord = wordStack.shift();
                var lastLine = thisClass._lines[thisClass._lines.length - 1];
                lastLine.addWord(nextWord);
                
                // Get the line dimensions
                var lineWidth = lastLine.width();
                var lineHeight = lastLine.height();
                
                // Get the y offset of the second last (sl) line
                var slLine = thisClass._lines.length > 1 ? (thisClass._lines[thisClass._lines.length - 2]) : null;
                var slY = (slLine !== null) ? ((-slLine.y) - (slLine.height()/2)) : radius;

                // Get the highest point at which the line may be placed
                var topY = pvt.circleVerticalAtWidth(radius, lineWidth, slY);

                // If line falls within bounds
                if(topY !== null){
                    // Determine the line's placement
                    topY += lineHeight/2;

                    // Check the width of the lower bound
                    var lowerEdgeWidth = pvt.circleWidthAtVertical(radius, -(topY + (lineHeight/2)));

                    // Lower bound is valid
                    if(lowerEdgeWidth > lineWidth){
                        // Set the position of the line
                        lastLine.y = topY;
                        assert(lineWidth < 2*radius);
                    }

                    // Lower bound is invalid
                    else{
                        var _tempTopY = topY;
                        topY = null;
                    }
                }
                
                // Limit the # of words in the first line
                if(thisClass._lines.length == 1 && maxWords !== null && maxWords < lastLine.length){
                    topY = null;
                }

                if(topY === null){
                    // Line is too wide
                    // 1. Remove the word that was just added
                    // 2. If there are no more words in the line then return false to indicate that there is a blank line
                    // 3. Otherwise add a new line

                    wordStack.unshift(lastLine.removeLast());
                    // Blank line => return false
                    if(lastLine.length == 0){
                        if(log !== null){
                            log.push("line-set::fitToCircleAtSize - blank line detected. Size failed.");
                            log.push("line-set::fitToCircleAtSize - fitted lines at point of failure:");
                            thisClass.forEach(function(l){
                                log.push("line-set::fitToCircleAtSize - \t" + l.text());
                            });
                        }
                        
                        if(thisClass._lines[0].length > 1){
                            var maxWords = (maxWords === null) ? thisClass._lines[0].length - 1 : (maxWords - 1);
                            return thisClass.fitToCircleAtSize(radius, family, size, {
                                log: log,
                                maxWords: maxWords
                            });
                        }/*else if(size == 10){
                            lastLine.addWord(wordStack.shift());
                            lastLine.y = _tempTopY;
                            thisClass._fontSize = 9;
                            return true;
                        }*/
                        return false;
                    }
                    // Line is now ok, add a new line
                    else{
                        pvt.addLine.call(thisClass, size, family);
                    }
                }
            }
            
            thisClass._lines.forEach(function(line){
                assert(line.width() < 2*radius);
            });
            
            // Adjust spacing
            var distanceBetweenLines = pvt.getDistanceBetweenLines.call(thisClass);
            var distIssues = distanceBetweenLines.filter(function(d){
                return d.dist > 0.1;
            });
            
            // Too much space between one or more lines
            while(distIssues.length > 0){
                var issue = distIssues.shift();
                var upper = issue.upper;
                var lower = issue.lower;
                var dist = issue.dist;

                // Try move all lines above the issue down into the gap
                var linesToShift = [];
                for(var l = 0; l <= upper; l++){
                    linesToShift.push(l);
                }

                if(pvt.shiftLines.call(thisClass, radius, linesToShift, dist)){
                    if(log !== null){
                        log.push("line-set::fitToCircleAtSize - shifting lines: " + linesToShift.toString() + " by: " + dist);
                    }

                    thisClass.forEach(function(d,i){
                        if(i <= upper){
                            d.y = d.y + dist;
                        }
                    });
                    
                    distanceBetweenLines = pvt.getDistanceBetweenLines.call(thisClass);
                    distIssues = distanceBetweenLines.filter(function(d){
                        return d.dist > 0.1;
                    }); 
                }
            }
            
            
            // Log final spacing
            if(log !== null){
                distanceBetweenLines = pvt.getDistanceBetweenLines.call(thisClass);
                distanceBetweenLines.forEach(function(d){
                     log.push("line-set::fitToCircleAtSize - distance " + d.desc + ": " + d.dist);
                });
            }
            
            // Try to center the text
            var spaceAbove = (thisClass._lines[0].y - (thisClass._lines[0].height()/2)) - (-radius);
            var spaceBelow = radius - (thisClass._lines[thisClass._lines.length - 1].y + (thisClass._lines[thisClass._lines.length - 1].height()/2));
            var evenSpace = (spaceAbove + spaceBelow)/2;
            
            var lines = thisClass._lines.map(function(d,i){
                return i;
            });
            
            // Shift direction
            var shiftAmt = (spaceAbove > spaceBelow) ? -(evenSpace - spaceBelow): (evenSpace - spaceAbove);
            if(log !== null){
                log.push("line-set::fitToCircleAtSize - require center shift: " + shiftAmt + " (above:"+spaceAbove+",below:"+spaceBelow+")");
            }
            
            
            
            // Cannot shift by the full amount so shift in increments
            if(center){
                if(!pvt.shiftLines.call(thisClass, radius, lines, shiftAmt)){
                    var factor = (shiftAmt < 0) ? -1 : 1;
                    shiftAmt = (shiftAmt < 0) ? -shiftAmt: shiftAmt;

                    for(var s = 0; s < shiftAmt; s += 0.1){
                        if(pvt.shiftLines.call(thisClass, radius, lines, factor*s)){
                            lines.forEach(function(l){
                                thisClass._lines[l].y = thisClass._lines[l].y + factor*s;
                            });
                        }else{
                            if(log !== null){
                                log.push("line-set::fitToCircleAtSize - total center shift " + ((s > 0) ? s-1 : s));
                            }
                            break;
                        }
                    }
                }
                // Shift by full amount
                else{
                    lines.forEach(function(l){
                        thisClass._lines[l].y = thisClass._lines[l].y + shiftAmt;
                    });
                }
            }
            
            //throw Error();
            
            // No words remaining and no errors fitting the words, valid fit found
            thisClass._fontSize = size;
            return true;
        }
        
        /**
         * Get the font size (if one exists)
         * @returns {number|null} - the font size or null of no fit was possible
         */
        fontSize(){
            return this._fontSize;
        }
        
        /**
         * Iterates over lines
         * @param {function} func
         */
        forEach(func){
            return this._lines.forEach(func);
        }
        
        /**
         * Indicates whether there is any variance in the distance between the lines
         * @returns {boolean}
         */
        hasDistanceIssues(){
            var thisClass = this;
            var distanceBetweenLines = pvt.getDistanceBetweenLines.call(thisClass);
            var distIssues = distanceBetweenLines.find(function(d){
                return d.dist > 0.1;
            });
            return (typeof distIssues !== 'undefined');
        }
        
        /**
         * Gets the line text
         * @returns {string} - the combined text of words separated by spaces
         */
        text(){
            return this._lines.map(function(d){
                return d.text();
            }).join(" ");
        }
    };
    
    /**
     * Add a new line to the set
     * @param {number} size - the font size
     * @param {string} family - the font family
     * @return {Line} - the new line
     */
    pvt.addLine = function(size, family){
        var thisClass = this;
        var l = new Line({
            "font-size": size,
            "font-family": family/*,
            "dictionary": thisClass._lineDictionary*/
        });
        thisClass._lines.push(l);
        return l;
    };
    
    /**
     * Determine the vertical point at which the circle's width matches the one given
     * @param {number} r - circle radius
     * @param {number} width - width to match
     * @param {number=r} max - vertical must be below the max
     * @return {number|null} - vertical at width or null if none exists
     */
    pvt.circleVerticalAtWidth = function(r, width, max){
        max = (typeof max === 'undefined' || max === null) ? r : max;
        
        var v = width/2;
        if(v > r){
            return null;
        }else{
            
            var vertical = Math.sqrt((r*r) - (v*v));
            if(vertical > max){
                // Check the width directly below
                var widthBelow = pvt.circleWidthAtVertical(r,max);
                if(widthBelow > width){
                    return -max;
                }else{
                    return null;
                }
            }else{
                // Positive should be above equator so negate
                return -vertical;
            }
        }
    };
    
    /**
     * Get the width of the circle at a given vertical (undoes circleVerticalAtWidth)
     * @param {number} r - circle radius
     * @param {number} y - vertical (height above equator)
     * @return {number|null} - width at vertical or null if none exists
     */
    pvt.circleWidthAtVertical = function(r, y){
        if(typeof y === 'undefined'){
            throw Error("invalid y");
        }
        
        var width = 2*Math.sqrt((r*r) - (y*y));
        if(Number.isNaN(width)){
            return null;
        }
        return width;
    };
    
    /**
     * Replace the last word with ellipses
     */
    pvt.ellipse = function(){
        var thisClass = this;
        if(thisClass._words[thisClass._words.length - 1].text == "..."){
            thisClass._words.pop();
        }
        thisClass._words.pop();
        thisClass.addWord(new Word({
            text: "...",
            italic: false 
        }));
    };
    
    /**
     * @param {number} numWords - # of words
     * @return {Combination[]} - list of word indices per line
     * 
     * @property {number[]} LineLookup - list of word indices
     * @property {LineLookup[]} Combination - single combination of lines
     */
    pvt.getCombinations = function(numWords, pairSet){
        var wordsPerLine = pvt.getWordsPerLine(numWords, pairSet);
        
        // Index the words
        var indexed = [];
        wordsPerLine.forEach(function(wpl){
            var i = 0;
            var set = [];
            wpl.forEach(function(num){
                var line = [];
                for(var w = 0; w < num; w++){
                    line.push(i++);
                }
                set.push(line);
            });
            indexed.push(set);
        });
        return indexed;
    };
    
    /**
     * Get the distance between the lines from the bottom of line a to to the top of line b
     * @return {object[]} - distances 
     */
    pvt.getDistanceBetweenLines = function(){
        var thisClass = this;
        var distanceBetweenLines = [];
            
        for(var l = 0; l < thisClass._lines.length - 1; l++){
            var lowerLineA = thisClass._lines[l].y + (thisClass._lines[l].height()/2);
            var upperLineB = thisClass._lines[l + 1].y - (thisClass._lines[l + 1].height()/2);
            distanceBetweenLines.push({
                upper: l,
                lower: l+1,
                desc: "between lines " + l + " and " + (l + 1),
                dist: (upperLineB - lowerLineA)
            });
        }
        
        return distanceBetweenLines;
    };
    
    /**
     * @param {number} numWords - # of words
     * @return {number[][]} - combination of all '# of words per line' sets
     */
    pvt.getWordsPerLine = function(numWords, pairSet){
        console.log("LineSet::pvt.getWordsPerLine - constructing tree of combinations");
        
        assertType(numWords, "number");
        if(numWords <= 0){
            return [[[]]];
        }else if(numWords == 1){
            return [[[0]]];
        }else if(numWords > 1){
            
            function pairs(n, pairSet){
                //console.log("LineSet::pvt.getWordsPerLine.paris - determining pairs");
                //return;
                if(pairSet.hasOwnProperty(n)){
                    return pairSet[n];
                }else{
                    console.log("pairing");
                    var bar = new Bar(n);
                    for(var i = 1; i < n; i++){
                        var tree = new Tree(pairs(i, pairSet), pairs(n - i, pairSet));
                        bar.trees.push(tree);
                    }
                    pairSet[n] = bar;
                    return bar;
                }
            }
            
            /**
             * @param {Bar} bar
             * @param {number} n - number of words
             * @param {boolean} innerTraverse - indicates whether the operation is an inner traverse
             * @return {number[][]}
             */
            function traverse(bar, n, innerTraverse){
                var sets = [];
                if(bar.traverse !== null){
                    return bar.traverse;
                }
                
                innerTraverse = (typeof innerTraverse === 'undefined') ? false : innerTraverse;
                
                // Select each tree
                bar.trees.forEach(function(tree){
                    var left = null;
                    var right = null;
                    
                    if(tree.isLeaf){
                        left = [[tree.left]];
                        right = [[tree.right]];
                    }else{
                        left = traverse(tree.left, n, true);
                        right = traverse(tree.right, n, true);
                    }
                    
                    /*if(!$.isNumeric(left)){
                        left = traverse(left);
                    }else{
                        left = [[left]];
                    }
                    var right = tree.right;
                    if(!$.isNumeric(right)){
                        right = traverse(right);
                    }else{
                        right = [[right]];
                    }*/
                    
                    for(var l = 0; l < left.length; l++){
                        for(var r = 0; r < right.length; r++){
                            sets.push(left[l].concat(right[r]));
                        }
                    }
                    
                    var k = 0;
                    
                });
                
                var traversedSets = sets.map(function(d){
                    return d.filter(function(f){
                        return (f != 0);
                    });
                });
                
                /*if(!innerTraverse){
                    var k = 0;
                }*/
                
                bar.traverse = traversedSets;
                return traversedSets;
            }
            
            function pairsItt(n, pairSet){
                // Get the pairs required to complete
                var trees = new JsClass.Hash();
                
                var open = new JsClass.Set();
                var closed = new JsClass.Set();
                for(var i = 1; i <= n; i++){
                    open.add(i);
                }
                
                while(open.length > 0){
                    var curr = open.first();
                    open.remove(curr);
                    
                    var possiblePairs = [[curr]];
                    for(var i = 1; i < curr; i++){
                        // Add the real values
                        possiblePairs.push([i, curr-i]);
                        
                        var leftPairs = trees.fetch(i),
                            rightPairs = trees.fetch(curr - i);
                        
                        
                        var combinedPairs = [];
                        for(var lindex = 0; lindex < leftPairs.length; lindex++){
                            for(var rindex = 0; rindex < rightPairs.length; rindex++){
                                combinedPairs.push([leftPairs[lindex], rightPairs[rindex]]);
                            }
                        }
                        
                        if(combinedPairs.length > 0){
                            combinedPairs = combinedPairs.map(function(pair){
                                return pair.reduce(function(acc, d){
                                    return acc.concat(d);
                                },[]);
                            });
                            possiblePairs = possiblePairs.concat(combinedPairs);
                        }
                    }
                    
                    
                    trees.store(curr, possiblePairs);
                    //throw Error();
                }
                
                var expectedNum = 1;
                for(var i = 1; i < n; i++){
                    expectedNum *= i;
                }
                
                throw Error();
                
                var requiredPairs = [];
                requiredPairs.push([0,n]);
                requiredPairs.push([n,0]);
                
                
                
                if(pairSet.hasOwnProperty(n)){
                    return pairSet[n];
                }else{
                    console.log("pairing");
                    
                    var stack = [];
                    
                    
                    var bar = new Bar(n);
                    for(var i = 1; i < n; i++){
                        var tree = new Tree(pairs(i, pairSet), pairs(n - i, pairSet));
                        bar.trees.push(tree);
                    }
                    pairSet[n] = bar;
                    return bar;
                }
            }
            
            /**
             * @param {Bar} bar
             * @param {number} n - number of words
             * @param {boolean} innerTraverse - indicates whether the operation is an inner traverse
             * @return {number[][]}
             */
            function traverseItt(n, ob){
                var bar = pairsItt(n,ob);
                
                
                var sets = [];
                if(bar.traverse !== null){
                    return bar.traverse;
                }
                
                innerTraverse = (typeof innerTraverse === 'undefined') ? false : innerTraverse;
                
                // Select each tree
                bar.trees.forEach(function(tree){
                    var left = null;
                    var right = null;
                    
                    if(tree.isLeaf){
                        left = [[tree.left]];
                        right = [[tree.right]];
                    }else{
                        left = traverse(tree.left, n, true);
                        right = traverse(tree.right, n, true);
                    }
                    
                    for(var l = 0; l < left.length; l++){
                        for(var r = 0; r < right.length; r++){
                            sets.push(left[l].concat(right[r]));
                        }
                    }
                    
                    var k = 0;
                    
                });
                
                var traversedSets = sets.map(function(d){
                    return d.filter(function(f){
                        return (f != 0);
                    });
                });
                
                /*if(!innerTraverse){
                    var k = 0;
                }*/
                
                bar.traverse = traversedSets;
                return traversedSets;
            }
            
            var ten_set_recurse = {};
            var sets_10_recurse = traverse(pairs(10, ten_set_recurse));
            
            var ten_set_itt = {};
            var sets_10_itt = traverseItt(10, ten_set_itt);
            
            assert(sets_10_recurse.length == sets_10_itt.length);
            
            throw Error();
            // Test pair performance
            /*for(var i = 0; i < 17; i++){
                pairs(i,pairSet); console.log("pairs "+i+" complete");
            }*/
            
            // Test traverse performance
            /*pairSet = {};
            for(var i = 0; i < 11; i++){
                traverse(pairs(i,pairSet),i); console.log("traverse "+i+" complete");
            }*/
            
            //traverse(pairs(14,pairSet)); console.log("traverse 12 complete");
            
            var bar = pairs(numWords, pairSet);
            var sets = traverse(bar);
            
            var searchMatrix = new JsClass.Hash();
            function lookup(arr, currResult){
                var nextArr = [];
                for(var i = 1; i < arr.length; i++){
                    nextArr.push(arr[i]);
                }
                var curr = arr[0];
                if(currResult.hasKey(curr)){
                    var r = currResult.fetch(curr);
                    if(nextArr.length == 0){
                        if(!r.hasKey("end")){
                            r.store("end", 1);
                            return true;
                        }else{
                            return false;
                        }
                    }else{
                        return lookup(nextArr, r);
                    }
                }else{
                    var newHash = new JsClass.Hash();

                    currResult.store(curr, new JsClass.Hash());
                    return lookup(arr, currResult);
                }
            }
            
            // Remove duplicates
            sets = sets.filter(function(d){
                return lookup(d,searchMatrix);
            });
            
            /*console.log(sets.map(function(d){
                return "{" + d.toString() + "}";
            }).toString());*/
            //console.log(bar.toString());
            
            return sets;
        }
    };
    
    /**
     * Shift the given lines vertically by the given amount and check if the shift is valid
     * @note - does not perform the shift, simply checks viability
     * @param {number} radius - the circle radius
     * @param {number[]} lines - indices of lines to shift
     * @param {number} amount - the amount to shift each line
     * @returns {boolean} - true if the shift is possible, otherwise false
     */
    pvt.shiftLines = function(radius, lines, amount){
        
        assertType(radius, 'number');
        assertType(lines, 'number[]');
        assertType(amount, 'number');
        
        var thisClass = this;
        for(var l = 0; l < lines.length; l++){
            var shiftedLine = thisClass._lines[l];
            var shiftedLineWidth = shiftedLine.width();
            var shiftedLineHeight = shiftedLine.height();
            var shiftedLineY = shiftedLine.y + amount;

            //thisClass._lines[l].y = thisClass._lines[l].y + dist;

            // Check the top
            var topY = shiftedLineY - (shiftedLineHeight/2);
            var radiusAtTop = pvt.circleWidthAtVertical(radius,topY);
            if(radiusAtTop === null || radiusAtTop < shiftedLineWidth){
                return false;
            }

            // Check the bottom
            var radiusAtBottom = pvt.circleWidthAtVertical(radius, shiftedLineY - (shiftedLineHeight/2));
            if(radiusAtTop === null || radiusAtBottom < shiftedLineWidth){
                return false;
            }

            // Perform shift
            //thisClass._lines[l].y = shiftedLineY;
        }
        return true;
    };
    
    /**
     * Check to see if the values of an array sum to the given value.
     * @param {number[]} arr
     * @param {number} to
     * @returns {boolean} - true if the values sum to the given, otherwise false
     */
    pvt.sumsTo = function(arr, to){
        // Check sum
        return (arr.reduce(function(acc,val){
            return acc + val;
        }, 0) == to);
    };
    
    return LineSet;
});

