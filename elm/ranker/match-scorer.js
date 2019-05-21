define([], function(){
    class Scorer{
        /**
         * Determine the match score
         * @param {string} term - term to match
         * @param {string[]}
         * @return {number} - the match score (11 best -> 1 worst)
         */
        score(term, match, fields){
            
            // 11. (superexcase) Multiple Fields Match & Multiple Exact Case Matches For Multiple Fields
            // 10. (superexact) Multiple Fields Match & Multiple Exact Case Matches In At Least One Field
            // 9. (majorexcase) Multiple Fields Match & Exact Case Match In At Least One Field
            // 8. (majorexact) Multiple Fields Match & Exact Match In At Least One Field
            // 7. (multiexcase) Single Field w/ Multiple Exact Case Matches
            // 6. (multiminexact) Single Field w/ (Multiple Matches & At least one Exact Case Match)
            // 5. (multiexact) Single Field w/ Multiple Exact Matches
            // 4. (multiminexact) Single Field w/ (Multiple Matches & At least one Exact Match)
            // 3. (excase) Single Field w/ Single Excat Case Match
            // 2. (exact) Single Field w/ Single Exact Match
            // 1. (multi) Single Field w/ Multiple Matches
            // 0. (single) Single Field w/ Single Matches
            var thisView = this;
            
            var scorableFields = fields;
            var fieldScores = scorableFields.filter(function(d){
                return (d !== null && typeof d !== 'undefined');
            }).map(function(d){
                assertType(d, "string");
                return thisView.scoreField(term, d);
            });
            
            // Filter out empty field scores
            var filteredScores = fieldScores.filter(function(d){
                return (d.length > 0);
            });
            
            if(filteredScores.length === 1){
                // Single field match
                var fscore = filteredScores[0];
                return thisView.interpretFieldScore(fscore);
            }else if(filteredScores.length > 1){
                // Multiple field match
                var interpreted = filteredScores.map(function(fscore){
                    return thisView.interpretFieldScore(fscore);
                });
                
                var numMultiExcase = interpreted.reduce(function(acc, val){
                    return acc + (val === 7 ? 1 : 0);
                }, 0);
                var numMultiExact = interpreted.reduce(function(acc, val){
                    return acc + (val === 7 ? 1 : 0);
                }, 0);
                
                if(numMultiExcase > 1){
                    return 11;
                }else if(numMultiExcase === 1){
                    return 10;
                }else if(numMultiExact > 1){
                    return 9;
                }else if(numMultiExact === 1){
                    return 8;
                }else{
                    return 7;
                }
            }else if(filteredScores.length === 0){
                throw Error("Should not be possible to get no matches on all fields.");
            }
            
            throw Error("Unscored");
        }
        
        interpretFieldScore(fscore){
            if(fscore.length === 1){
                // Single match
                switch(fscore[0]){
                    case "":    
                    case "case":
                        return 0; // (single)
                    case "exact":   
                        return 2; // (exact)
                    case "exactcase": 
                        return 3; // (excase)
                }
            }else if(fscore.length > 1){
                // Mutiple match
                var numExcase = fscore.reduce(function(acc, val){
                    return acc + (val === "exactcase" ? 1 : 0);
                }, 0);
                var numExact = fscore.reduce(function(acc, val){
                    return acc + (val === "exact" ? 1 : 0);
                }, 0);

                if(numExcase > 1){
                    return 7; // (multiexcase)
                }else if(numExcase === 1){
                    return 6; // (multiminexcase)
                }else if(numExact > 1){
                    return 5; // (multiexact)
                }else if(numExact === 1){
                    return 5; // (mutliminexact)
                }else{
                    return 1; // (multi)
                }
            }
            
            throw Error("unscored");
        }
    
        
        /**
         * Score a single field
         * @param {string} term - term to match
         * @param {string} field - field to score
         * @return {undefined}
         */
        scoreField(term, field){
            assertType(term, "string");
            assertType(field, "string");
            var base = field;
            var baseLower = base.toLowerCase();
            
            var termNoSlash = term.replaceAll("\\", "");
            
            var offset = -1;
            var occurances = [];
            
            do{
                offset = baseLower.indexOf(termNoSlash.toLowerCase(), offset + 1);
                if(offset !== -1){
                    // Check case match
                    var caseMatch = (base.substr(offset, termNoSlash.length) === termNoSlash);
                    
                    // Check exact word match
                    var exactMatch = (baseLower.trim().length === termNoSlash.trim().length) || (baseLower.substr(offset - 1, termNoSlash.length + 1).trim() === termNoSlash);
                    
                    occurances.push("" + ((exactMatch) ? "exact" : "") + ((caseMatch) ? "case" : ""));
                }
            }while(offset !== -1);
                
            return occurances;
        }
    }
    
    return Scorer;
});

