/**
 * Wrapper for map models
 */


define(["./base-wrapper", "../main"], function(BaseWrapper, Hub){
    var Wrapper = BaseWrapper.extend({
        
        /**
         * Get the ids of the domains tagged with the subject
         * @return {number[]}
         */
        domainIDs: function(){
            var thisModel = this;
            return thisModel.domains().map(function(d){
                return Number(d.get("domainid"));
            });
        },
        
        /**
         * Get the grades tagged with the subject
         * @return {Backbone.Model}
         */
        domains: function(){
            var thisModel = this;
            return Hub.get("domain").where({subjectid: thisModel.id});
        },
        
        /**
         * Get the ids of the gardes tagged with the subject
         * @return {number[]}
         */
        gradeIDs: function(){
            var thisModel = this;
            return thisModel.grades().map(function(d){
                return Number(d.get("gradeid"));
            });
        },
        
        /**
         * Get the grades tagged with the subject
         * @return {Backbone.Model[]}
         */
        grades: function(){
            var thisModel = this;
            return Hub.get("grade").where({subjectid: thisModel.id});
        },
        
        /**
         * Get the standards for this subject
         * @return {Backbone.Model[]} - list of standards
         */
        standards: function(){
            var thisModel = this;
            var subjectDomains = thisModel.domains();
            var subjectGrades = thisModel.grades();

            // Get domain standards
            var domainStandards = subjectDomains.map(function(domain){
                return Hub.wrap(domain).standardIDs();
            }).reduce(function(acc,val){
                return acc.concat(val);
            },[]);

            // Get grade standards
            var gradeStandards = subjectGrades.map(function(grade){
                return Hub.wrap(grade).standardIDs();
            }).reduce(function(acc,val){
                return acc.concat(val);
            },[]);

            // Combine standards 
            var standardIDs = domainStandards.concat(gradeStandards);
            
            // Eliminate duplicates
            standardIDs.sort();
            for(var i = 0; i < standardIDs.length - 1; i++){
                if(standardIDs[i] === standardIDs[i + 1]){
                    standardIDs.splice(i, 1);
                    i--;
                }
            }

            // Get models and return
            return standardIDs.map(function(d){
                return Hub.get("standard").get(d);
            });
        }
    });
    return function(toWrap){ return BaseWrapper.wrap(toWrap, Wrapper); }
});


