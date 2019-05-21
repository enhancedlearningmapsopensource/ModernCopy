define(["hub-lib"], function(Hub){
    class Qualifier{
        constructor(){
            var thisClass = this;
            thisClass._name = "ela";
            thisClass._reg = new RegExp("^[a-zA-Z]+\.[0-9K]+\.[0-9]+.*", "gi");
        }
        
        subjectName(){
            return this._name;
        }
        
        /**
         * Checks to see if the given model qualifies for this subject.
         * @param {Backbone.Model} hubmodel - the model to qualify
         * @return {bool} - true if the given hubmodel can be qualified, otherwise false.
         */
        matches(hubmodel){
            var thisClass = this;
            
            assert(hubmodel.get("type") === "simplestandard");
            var textID = Hub.stripHtml(hubmodel.get("textid"));
            return (thisClass._reg.test(textID));
        }
    }
    
    return Qualifier;
});

