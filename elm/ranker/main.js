define(["./grid-ranker",
        "./omni-ranker"], 
 function(GridRanker,
          OmniRanker){
    
    var pvt = {};
    
    class Ranker{
        constructor(){
            var thisClass = this;
            thisClass._gridranker = new GridRanker(thisClass);
            thisClass._omniranker = new OmniRanker(thisClass);
        }
        
        
        /**
         * Perform an exact match on the given strings using the term
         * @param {string[]} strings - the strings to match
         * @param {string} term - the term that must be contained to be returned
         * @return {string[]} - strings that are an exact match with the string.
         */
        exactSearch(strings, term){            
            var reg = new RegExp(".*" + term + "[^a-z0-9].*", 'i');
            return strings.filter(function(d){
                return (d.toLowerCase() === term.toLowerCase() || reg.test(d));
            });
        }
        
        grid(results){
            var thisClass = this;
            return thisClass._gridranker.rank(results);
        }
        
        omni(results, term){
            var thisClass = this;
            return thisClass._omniranker.rank(results, term);
        }
    }
    
    var singleton = new Ranker();
    return singleton;
})

