define(["hub-lib", 
        "fuzzysearch", 
        "./searcher",
        "./subject-qualifiers/math-qualifier",
        "./subject-qualifiers/ela-qualifier"], 
function(Hub, 
         FuzzySearch, 
         Searcher,
         MathQualifier,
         ElaQualifier){
             
    // Construct the search set
    var searchSet = null;
    var qualifiers = [
        new MathQualifier(),
        new ElaQualifier()
    ];
    
    class StandardSearcher extends Searcher{
        
        buildSearchSet(table){
            searchSet = {
                _byid: {},
                _grades: {},
                _domains: {}
            };
            
            searchSet.items = Hub.get(table).map(function(d, i){
                var wrapped = Hub.wrap(d);
                searchSet._byid[d.id] = i;
                return {
                    id: d.id,
                    broad: [
                        Hub.stripHtml(d.get("textid"))
                    ].join(" ").toLowerCase()
                };
            });     
        }
        
        defineSets(searchOb){
            var thisClass = this;
            
            if(!searchOb.hasOwnProperty("subject")){
                thisClass.defineSubjects(searchOb);
            }
            
            if(searchOb.subject.length === 0){
                searchOb.set = [];
            }else{
                searchOb.set = [Hub.get("subject").get(searchOb.subject[0]).get("setid")];
            }
        }
        
        defineSubjects(searchOb){
            var thisClass = this;
            var model = Hub.get("simplestandard").get(searchOb.id);
            
            var subjects = qualifiers.filter(function(qual){
                return (qual.matches(model));
            }).map(function(qual){
                return qual.subjectName();
            });
            searchOb.subject = subjects;
            return;
            
            var gradeID = model.get("gradeid");
            var domainID = model.get("domainid");
            
            var subjects = [];
            
            // Grade
            if(gradeID !== -1){
                if(!searchSet._grades.hasOwnProperty(gradeID)){
                    searchSet._grades[gradeID] = {};
                }
                var grade = searchSet._grades[gradeID];
                if(!grade.hasOwnProperty("subject")){
                    grade.subject = Hub.get("grade").get(gradeID).get("subjectid");
                }
                subjects.push(grade.subject);
            }
            
            // Domain
            if(domainID !== -1){
                if(!searchSet._domains.hasOwnProperty(domainID)){
                    searchSet._domains[domainID] = {};
                }
                var domain = searchSet._domains[domainID];
                if(!domain.hasOwnProperty("subject")){
                    domain.subject = Hub.get("domain").get(domainID).get("subjectid");
                }
                subjects.push(domain.subject);
            }
            
            
            removeDuplicates(subjects);
            assert(subjects.length < 2);
            
            //var wrapped = Hub.wrap(model);
            searchOb.subject = subjects;
        }
        
        reset(){
            searchSet = null;
        }
        
        search(term, timing){
            var thisClass = this;
            timing.start("search ([" + thisClass.type() + "::searcher].search()," + term.value + ")");
            
            var searchSet = thisClass.searchSet();
            if(searchSet === null){
                timing.start("build search set ([" + thisClass.type() + "::searcher].search()," + term.value + ")");
                thisClass.buildSearchSet("standard");
                searchSet = thisClass.searchSet();
                timing.stop("build search set ([" + thisClass.type() + "::searcher].search()," + term.value + ")");
            }
            
            var start = timeNow();
            var resultSet = searchSet.items;
            
            // Apply Set Filter
            if(term.hasOwnProperty("set")){
                resultSet = resultSet.filter(function(d){
                    if(!d.hasOwnProperty("set")){
                        thisClass.defineSets(d);
                    }
                    
                    // If there are no sets associated to the node then keep
                    if(d.set.length === 0){
                        return true;
                    }
                    
                    // Filter out other sets
                    for(var i = 0; i < d.set.length; i++){
                        for(var j = 0; j < term.set; j++){
                            if(d.set[i] === term.set[j]){
                                return true;
                            }
                        }
                    }
                    return false;
                });
            }
            
            // Apply Subject Filter
            if(term.hasOwnProperty("subject")){
                resultSet = resultSet.filter(function(d){
                    if(!d.hasOwnProperty("subject")){
                        thisClass.defineSubjects(d);
                    }
                    
                    // If there are no subjects associated to the node then keep
                    if(d.subject.length === 0){
                        return true;
                    }
                    
                    // Filter out other subjects
                    for(var i = 0; i < d.subject.length; i++){
                        for(var j = 0; j < term.subject; j++){
                            if(d.subject[i] === term.subject[j]){
                                return true;
                            }
                        }
                    }
                    return false;
                });
            }
            
            resultSet = resultSet.filter(function(s){
                return FuzzySearch(term.value, s.broad);
            });
            
            
            var time = timeNow() - start;
            timing.stop("search ([" + thisClass.type() + "::searcher].search()," + term.value + ")");
            
            return {
                matches: resultSet.map(function(d){
                    return d.id;
                }),
                time: time
            };
        }
        
        searchSet(){
            var thisClass = this;
            if(searchSet === null){
                thisClass.buildSearchSet("simplestandard");
            }
            return searchSet;
        }
        
        type(){
            return "standard";
        }
    };
    
    
    var singleton = new StandardSearcher();
    return singleton;
});



