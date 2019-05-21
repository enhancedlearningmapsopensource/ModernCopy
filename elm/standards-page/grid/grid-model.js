define(["backbone", "../grid-section/grid-section-collection"], 
function(Backbone, GridSectionCollection){
             
    var pvt = {};         
    var Model = Backbone.Model.extend({
        countNonElmMaps: function(){
            var thisModel = this;
            return thisModel.get("sections").reduce(function(acc, val){
                return acc + val.countNonElmMaps();
            }, 0);
        },
        
        countNonResourceMaps: function(){
            var thisModel = this;
            return thisModel.get("sections").reduce(function(acc, val){
                return acc + val.countNonResourceMaps();
            }, 0);
        },
        
        hasElmMaps: function(){
            var thisModel = this;
            return pvt.matchAnySection.call(thisModel, function(s){return s.hasElmMaps();});
        },
    
        hasResMaps: function(){
            var thisModel = this;
            return pvt.matchAnySection.call(thisModel, function(s){return s.hasResMaps();});
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisModel = this;
            thisModel.set({
                "sections": new GridSectionCollection(),
                "hasactivecell": false
            });
        },
        
        /**
         * Render the view
         */
        parse:function(data){
            var thisModel = this;
        }
    });
    
    /**
     * Check all sections and return true if any match the given function (return true)
     * @param {(SectionModel) -> (boolean)} f
     * @return {boolean}
     */
    pvt.matchAnySection = function(f){
        var thisModel = this;
        var sections = thisModel.get("sections");
        for(var i = 0; i < sections.length; i++){
            if(f(sections.at(i))){
                return true;
            }
        }
        return false;
    };
    
    return Model;
});