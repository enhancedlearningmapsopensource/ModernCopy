/* 
 * Line object
 */
define(["svglib/text-manager/line", "jsclass!3rdParty/jsclass/", "svglib/text-manager/word", ],function(Line, JsClass, Word){
    var pvt = {};
    
    class Tree{
        constructor(left, right, isLeaf){
            isLeaf = (typeof isLeaf === 'undefined') ? false : isLeaf;
            if(!isLeaf){
                assertType(left, "object");
                assertType(right, "object");
            }
            this.isLeaf = isLeaf;
            this.left = left;
            this.right = right;
        }

        toString(){
            var thisClass = this;
            return "{" + [thisClass.left, thisClass.right].join() + "}";
        }
    }

    class Bar{
        constructor(n){
            this.n = n;
            this.traverse = null;
            assertType(n, "number");
            this.trees = [
                new Tree(0,n,true)
            ];
        }

        toString(){
            var thisClass = this;
            return thisClass.n + "::[" + thisClass.trees.map(function(d){return d.toString();}).join() + "]";
        }
    }
    
    class LineSet{
        constructor(options){
            var thisClass = this;
            
            // Ensure options
            options = (!options) ? {} : options;
            
            // Unsettable 
            // @type {object[]}
            thisClass._lineDictionary = [];
            
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
            
            // Remove words if there are more than 11
            var twelvePlus = false;
            while(thisClass._words.length > 11){
                twelvePlus = true;
                thisClass._words.pop();
            }
            if(twelvePlus){
                thisClass.addWord(new Word({text: "...", italic: false}));
            }
            
            // Shortcuts
            var radius = options.radius;
            var family = options.family;
            var range = options["font-range"];
            options = null;
            
            console.log("LineSet::fitToCircle - fitting text: '"+thisClass._words.map(function(w){return w.text;}).join(" ")+"'");
            
            // Get all possible combinations of words per line
            var combinations = pvt.getCombinations(thisClass._words.length, window.globalPairs/*thisClass._pairs*/);
            console.log("LineSet::fitToCircle - # possible combinations: '"+combinations.length+"'");
            
            for(var fontSize = range.max; fontSize >= range.min; fontSize--){
                console.log("LineSet::fitToCircle - fitting to size: '"+fontSize+"'");
                if(thisClass.fitToCircleAtSize(radius, family, fontSize, combinations)){
                    console.log("size: " + fontSize + ", pass: true");
                    return true;
                }else{
                    console.log("size: " + fontSize + ", pass: false");
                }
            }
        }
        
        /**
         * Fit words to circle
         * @param {number} radius - the circle radius
         * @param {string} family - the font family to use
         * @param {number} size - the font size to use
         * @returns {Boolean} - true if the fit was successfull, otherwise false
         */
        fitToCircleAtSize(radius, family, size, combinations){
            var thisClass = this;
            assertType(radius, "number");
            assertType(family, "string");
            assertType(size, "number");
            
            // Clear lines
            thisClass._lines = [];
            
            // The previous line's y coord
            var prevLineY = null;
            
            // The set of valid fitted lines
            var fittedLineSets = [];
            
            for(var setindex = 0; setindex < combinations.length; setindex++){
                var set = combinations[setindex];
                var i = setindex;
            
                
                for(var lineindex = 0; lineindex < set.length; lineindex++){
                    var line = set[lineindex];
                    
                    var l = new Line({
                        "font-size": size,
                        "font-family": family,
                        "dictionary": thisClass._lineDictionary
                    });
                    line.forEach(function(wordIndex){
                       l.addWord(thisClass._words[wordIndex]); 
                    });
                    
                    // Does line 1 fit anywhere

                    // Get the dimensions of the line
                    var lineWidth = l.width();
                    var lineHeight = l.height();
                    
                    // Get the highest possible point that the line can be placed in the circle
                    var highestPoint = pvt.circleVerticalAtWidth(radius, lineWidth, prevLineY);
                    
                    if(highestPoint !== null){
                        // Determine the line's placement
                        highestPoint += lineHeight/2;
                        
                        // Check the width of the lower bound
                        var lowerEdgeWidth = pvt.circleWidthAtVertical(radius, -(highestPoint + lineHeight));
                        if(lowerEdgeWidth > lineWidth){
                            // Set the position of the line
                            l.y = highestPoint;

                            // Set the 'prev' value
                            prevLineY = (-l.y) - (lineHeight/2);
                        }else{
                            l = null;
                        }
                    }else{
                        l = null;
                    }
                    
                    if(l == null){
                        thisClass._lines = [];
                        prevLineY = null;
                        break;
                    }
                    thisClass._lines.push(l);
                }
                
                if(thisClass._lines.length > 0){
                    fittedLineSets.push({
                        lines: thisClass._lines
                    });
                    thisClass._lines = [];
                    prevLineY = null;
                }
            }
            
            
            
            if(fittedLineSets.length > 1){
                fittedLineSets.forEach(function(set){
                    var dist = [];
                    for(var i = 0; i < set.lines.length - 1; i++){
                        var lineA = set.lines[i];
                        var lineB = set.lines[i + 1];
                        
                        var lineABot = lineA.y + (lineA.height()/2);
                        var lineBTop = lineB.y - (lineB.height()/2);
                        
                        dist.push(lineBTop - lineABot);
                    }
                    set.distanceBetweenLines = dist;
                    set.maxDistance = dist.reduce(function(max, dist){
                        return Math.max(max, dist);
                    }, 0);
                });
                
                // Group by max distance between
                var grMaxDist = fittedLineSets.map(function(d){ // Get max distance for each set
                    return d.maxDistance;
                })
                .unique() // Remove duplicates
                .map(function(dist){   // Group
                    return {
                        dist: dist,
                        sets: fittedLineSets.filter(function(set){
                            return (set.maxDistance == dist);
                        })
                    };
                });
                
                // Keep the one with the lowest distance between
                fittedLineSets = grMaxDist.shift().sets;
                grMaxDist = null;
                
                fittedLineSets.forEach(function(d){
                    var width = d.lines.reduce(function(acc, d){
                        return Math.max(d.width(), acc); 
                    }, 0);
                    var height = d.lines.reduce(function(acc, d){
                        return acc + d.height(); 
                    }, 0);
                    d.area = width*height;
                });
                
                fittedLineSets.sort(function(a,b){
                    return b.area - a.area;
                });
                thisClass._lines = fittedLineSets[Math.floor((fittedLineSets.length/2))].lines;
            }else if(fittedLineSets.length == 1){
                thisClass._lines = fittedLineSets[0].lines;
            }
            
            
            console.log("# fitted sets: " + fittedLineSets.length);
            
            return (thisClass._lines.length > 0);
        }
        
        /**
         * Iterates over lines
         * @param {function} func
         */
        forEach(func){
            return this._lines.forEach(func);
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
        return 2*Math.sqrt((r*r) - (y*y));
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

