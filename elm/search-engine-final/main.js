define(["./node-searcher", 
        "./standard-searcher", 
        "./map-searcher", 
        "hub-lib",
        "timing"],
function(NodeSearcher, 
         StandardSearcher, 
         MapSearcher, 
         Hub,
         CreateTimer){
    var pvt = {};
    
    class SearchEngine{
        reset(type){
            var thisClass = this;
            if(typeof type === "undefined" || type === null){
                thisClass.reset("map");
                thisClass.reset("standard");
                thisClass.reset("node");
            }
            
            switch(type){
                case "map":
                    MapSearcher.reset();
                    break;
                case "node":
                    NodeSearcher.reset();
                    break;
                case "standard":
                    StandardSearcher.reset();
                    break;
                default:
                    throw Error("unknown type: " + type);
            }
        }
        
        /**
         * Perform search
         * @param {object|object[]} terms
         * @param {string|string[]} terms.value - the thing to search for
         * @param {string|number} terms.subject - the subject to restrict to
         * @param {string|number} terms.set - the set to restrict to
         * @param {string|number} terms.grade - the grade to restrict to
         * @param {string|number} terms.domain - the domain to restrict to
         */
        search(terms, timing){
            var thisClass = this;
            
            if(typeof timing === "undefined" || timing === null){
                timing = {};
            }
            CreateTimer(timing);
            
            // If array then perform multiple searches
            if($.isArray(terms)){
                timing["all terms"] = timeNow();
                var compiledTerms = terms.map(function(d){
                    return thisClass.search(d, timing);
                });
                timing["all terms"] = timeNow() - timing["all terms"];
                return compiledTerms;
            }
            
            timing["total (" + terms.value + ")"] = timeNow();
            
            // Get term value
            assertType(terms, "object");
            assertDefined(terms.value);
            
            // Find set
            pvt.findSet(terms);
            
            // Find subject
            pvt.findSubject(terms);
            
            var termSet = pvt.toArray(terms.value).map(function(val){
                // Reassign other parts
                var termPiece = {value: val};
                Object.keys(terms).forEach(function(key){                    
                    switch(key){
                        case "subject":
                        case "set":
                        case "grade":
                        case "domain":
                            termPiece[key] = terms[key];
                            break;
                    }
                });   
                return termPiece;
            });
            
            // Perform searches of each component part
            timing["search (" + terms.value + ")"] = timeNow();
            var termResults = termSet.map(function(term){
                term.value = term.value.toLowerCase();
                return {
                    term: term,
                    node: NodeSearcher.search(term, timing),
                    standard: StandardSearcher.search(term, timing),
                    map: MapSearcher.search(term, timing)
                };
            });
            timing["search (" + terms.value + ")"] = timeNow() - timing["search (" + terms.value + ")"];
            timing["total (" + terms.value + ")"] = timeNow() - timing["total (" + terms.value + ")"];
            return termResults;
        }
    };
    
    /**
     * Find the set
     * @param {object} terms - the serach term object
     */
    pvt.findSet = function(terms){
        if(terms.hasOwnProperty("set")){
            if(typeof terms.subject === "string"){
                var setOptions = Hub.get("set").where({
                    name: terms.set
                });
                if(setOptions.length === 0){
                    console.warn("Cannot find set: " + terms.set + ". Ignoring set.");
                    terms.set = null;
                }else{
                    terms.set = setOptions.map(function(d){
                        return d.id;
                    });
                }
            }
        }
    }
    
    /**
     * Find the subject
     * @param {object} terms - the serach term object
     */
    pvt.findSubject = function(terms){
        // Find subject
        if(terms.hasOwnProperty("subject")){
            if(typeof terms.subject === "string"){
                var subjectOptions = Hub.get("subject").where({
                    name: terms.subject
                });
                if(subjectOptions.length === 0){
                    console.warn("Cannot find subject: " + terms.subject + ". Ignoring subject.");
                    terms.subject = null;
                }else{
                    terms.subject = subjectOptions.map(function(d){
                        return d.id;
                    });
                }
            }
        }
    };
    
    
    
    /**
     * Convert to array of strings
     * @type {string[]|string} str - thing to make array from
     */
    pvt.toArray = function(str){
        // If array
        if($.isArray(str)){
            str = str.map(function(d){
                return d.toString();
            });
        }
        // If string
        else if(typeof str === "string"){
            str = str.split(" ");
        }
        // If other
        else{
            return pvt.toArray(str.toString());
        }
        return str.filter(function(d){
            return (d.trim().length > 0);
        }); 
    };
    
    var singleton = new SearchEngine();
    return singleton;
});

