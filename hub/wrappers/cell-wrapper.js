/**
 * Wrapper for map models
 */


define(["./base-wrapper", "../main"], function(BaseWrapper, Hub){
    var Wrapper = BaseWrapper.extend({
        /**
         * Determine the column index (maps to the ord of the column)
         * @return - the column index (ord of the column)
         */
        columnIndex: function(){
            var thisModel = this;
            
            var domainGroupID = thisModel.get("domaingroupid");
            var ord = thisModel.get("ord");
            
            // Find domain group offset
            var domainGroup = Hub.get("domaingroup").get(domainGroupID);
            var domainOrd = domainGroup.get("ord");
            
            // Find all domain groups in the row
            var domainGroups = Hub.get("domaingroup").where({roword: domainGroup.get("roword")}, false, Hub);
            
            // Sort by ord
            domainGroups.sort(function(a,b){
                return a.get("ord") - b.get("ord");
            });
            
            // Cell Index
            var cellIndex = 0;
            for(var i = 0; i < domainGroups.length; i++){
                if(domainGroups[i].id === domainGroupID){
                    cellIndex += ord;
                    break;
                }else{
                    var jump = domainGroups[i + 1].get("ord") - domainGroups[i].get("ord");
                    if(jump > 1){
                        cellIndex += jump - 1;
                    }
                    
                    // Get all cells in the domaingroup
                    var groupCells = Hub.get("cell").where({domaingroupid: domainGroups[i].id}, false, Hub);
                    cellIndex += groupCells.length;
                }
            }
            
            return cellIndex;
        }
    });
    return function(toWrap){ return BaseWrapper.wrap(toWrap, Wrapper); }
});


