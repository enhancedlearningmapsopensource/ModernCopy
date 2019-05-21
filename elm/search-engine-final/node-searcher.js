define(["hub-lib", 
        "fuzzysearch", 
        "./searcher", 
        "./standard-searcher"
], function(Hub, 
            FuzzySearch, 
            Searcher, 
            StandardSearcher){
        
        
    // Construct the search set
    var searchSet = null;
    var pvt = {};
    
    class NodeSearcher extends Searcher{
        
        buildSearchSet(table, timing){
            timing.start("build search set (NodeSearcher.buildSearchSet())");
            searchSet = {
                _byid: {}
            },
            searchSet.items = Hub.get(table).map(function(d, i){
                var wrapped = Hub.wrap(d);
                searchSet._byid[d.id] = i;
                return {
                    id: d.id,
                    broad: [
                        Hub.stripHtml(d.get("textid")),
                        Hub.stripHtml(d.get("title")),
                        Hub.stripHtml(d.get("shorttitle"))
                    ].join(" ").toLowerCase()
                    //sids: wrapped.getSIDs()
                };
            }); 
            timing.stop("build search set (NodeSearcher.buildSearchSet())");
        }
        
        defineSets(searchOb){
            var thisClass = this;
            
            if(!searchOb.hasOwnProperty("subject")){
                thisClass.defineSubjects(searchOb);
            }
            
            var subjects = searchOb.subject;
            var sets = Hub.getModels("subject", subjects).map(function(d){
                return d.get("setid");
            });
            removeDuplicates(sets);
            
            searchOb.set = sets;
            assertDefined(searchOb.set);
        }
        
        defineSubjects(searchOb, timing){
            var thisClass = this;
            timing.startsub("NodeSearcher.defineSubjects()");
            
            timing.startsub("NodeSearcher.defineSubjects() get sids");
            var sids = pvt.getSIDs(searchOb, timing);
            timing.stopsub("NodeSearcher.defineSubjects() get sids");
            //var wrapped = Hub.wrap(model);
            
            //var standards = Hub.get("standard");
            //var sids = searchOb.sids;//wrapped.getSIDs();
            
            var subjects = sids.map(function(d){
                var standard = StandardSearcher.searchSet().items[StandardSearcher.searchSet()._byid[d]];
                if(typeof standard === "undefined"){
                    var oldStandard = Hub.wrap(Hub.get("standard").get(d)).textID();
                    throw Error("Cannot find new standard for standard with textid: " + oldStandard);
                }
                
                if(!standard.hasOwnProperty("subject")){
                    StandardSearcher.defineSubjects(standard);
                }
                if(standard.subject.length === 0){
                    throw Error("No subject for standard: " + standard.broad);
                    StandardSearcher.defineSubjects(standard);
                }
                return standard.subject[0];
            });
            removeDuplicates(subjects);
            
            searchOb.subject = subjects;
            assertDefined(searchOb.subject);
            timing.stopsub("NodeSearcher.defineSubjects()");
        }
        
        reset(){
            searchSet = null;
        }
        
        searchSet(){
            return searchSet;
        }
        
        type(){
            return "node";
        }
    };
    
    
    pvt.getSIDs = function(searchOb, timing){
        var model = Hub.get("node").get(searchOb.id);
        if(false){
            var sids = searchOb.sids;
        }else{
            timing.startsub("NodeSearcher.pvt.getSIDs() wrap");
            var wrapped = Hub.wrap(model);
            timing.stopsub("NodeSearcher.pvt.getSIDs() wrap");
            
            timing.startsub("NodeSearcher.pvt.getSIDs() getSIDs");
            var sids = wrapped.getSIDs();
            timing.stopsub("NodeSearcher.pvt.getSIDs() getSIDs");
            /*timing.startsub("NodeSearcher.pvt.getSIDs() Hub.search");
            var sidsv = Hub.search("nodestandard", searchOb.id);
            timing.stopsub("NodeSearcher.pvt.getSIDs() Hub.search");*/
            
            //sids.sort();
            //sidsv.sort();
            
            //assert(sids.join() === sidsv.join());
        }
        return sids;
    };
    
    
    var singleton = new NodeSearcher();
    return singleton;
});



