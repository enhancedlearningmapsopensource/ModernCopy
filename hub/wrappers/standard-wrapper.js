/**
 * Wrapper for map models
 */


define(["./base-wrapper", "../main"], function(BaseWrapper, Hub){
    var Wrapper = BaseWrapper.extend({
        
        /**
         * Get the ids of the nodes tagged with the standard
         * @return {number[]}
         */
        nodeIDs: function(){
            var thisModel = this;
            return Hub.get("nodestandard").where({sid: thisModel.id}).map(function(r){
                return Number(r.get("nodeid"));
            });
        },
        
        /**
         * Get the nodes tagged with the standard
         * @return {Backbone.Model[]}
         */
        nodes: function(){
            var thisModel = this;
            return Hub.getModels("node", thisModel.nodeIDs());
        },
        
        /**
         * Get subject id of standard
         * @return {unresolved}
         */
        subjectID: function(){
            var thisModel = this;
            
            // Get subject ID of domain
            var domain = Hub.get("domain").get(thisModel.get("domainid"));
            if(domain){
                var domainSubjectID = domain.get("subjectid");
            }
            
             // Get subject ID of grade
            var grade = Hub.get("grade").get(thisModel.get("gradeid"));
            if(grade){
                var gradeSubjectID = grade.get("subjectid");
            }
            
            if(domainSubjectID && gradeSubjectID){
                assert(domainSubjectID === gradeSubjectID);
                return Number(domainSubjectID);
            }else if(domainSubjectID){
                return Number(domainSubjectID);
            }else if(gradeSubjectID){
                return Number(gradeSubjectID);
            }else{
                throw Error();
                return null;
            }
        },
        
        subjectIDs: function(){
            return [this.subjectID()];
        },
        
        /**
         * Get the standard textid
         * @return {string} - standard textid.
         */
        textID: function(){
            var thisModel = this;
            
            if(!thisModel.has("ruleid")){
                return null;
            }else{ 
                if(thisModel.has("_textid")){
                    return thisModel.get("_textid");
                }
                
                // Get the rule
                var ruleModel = Hub.getModels("rule", [thisModel.get("ruleid")])[0];
                if(!ruleModel){
                    return null;
                }
                var ruleString = Hub.stripHtml(ruleModel.get("textid"));
                
                var domain = Hub.getModels("domain", [thisModel.get("domainid")])[0];
                var grade = Hub.getModels("grade", [thisModel.get("gradeid")])[0];
                if(typeof domain !== 'undefined' && domain !== null){
                    ruleString = ruleString.replaceAll("{DOMAIN}", domain.get("short"))
                                           .replaceAll("{TOPIC}", domain.get("short"));
                }

                if(typeof grade !== 'undefined' && grade !== null){
                    ruleString = ruleString.split("{GRADE}").join(grade.get("short"));
                }
                ruleString = Hub.stripHtml(ruleString.split("{TRAIL}").join(thisModel.get("trail")));
                thisModel.set("_textid", ruleString);
                return assertType(ruleString, "string");
            }
        }
        
        
    });
    return function(toWrap){ return BaseWrapper.wrap(toWrap, Wrapper); }
});


