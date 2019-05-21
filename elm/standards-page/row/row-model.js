define(["backbone", "../domain/domain-collection", "hub-lib"], 
function(Backbone, DomainCollection, Hub){
             
    var pvt = {};         
    var Model = Backbone.Model.extend({
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisModel = this;
            assert(thisModel.has("subject"));
            thisModel.set({
                "domains": new DomainCollection()     // True if the hub's cell table has been loaded
            });
        },
        
        /**
         * Get the width of the column (in cells)
         * @return {number}
         */
        width: function(){
            var thisModel = this;
            var domains = thisModel.get("domains");
            if(domains.length === 0){
                return 0;
            }
            
            /*var width = 0;
            if(Hub.stripHtml(domains.at(0).get("hubmodel").get("name")) === "Numbers & Operations - Base Ten"){
                var k =0;
            }
            
            
            
            var lastOrd = domains.at(0).get("hubmodel").get("ord");
            domains.forEach(function(d){
                var hubmodel = d.get("hubmodel");
                while(hubmodel.get("ord") > lastOrd){
                    width += 1;
                    lastOrd++;
                }
                width += d.get("cells").length;
                lastOrd++;
            });
            
            if(width > 11){*/
                // Parse out essential information from domains
                var domainsTrimmed = domains.map(function(d){
                    return {
                        name: Hub.stripHtml(d.get("hubmodel").get("name")),
                        ord: d.get("hubmodel").get("ord"),
                        cells: d.get("cells").length
                    };
                });
                
                // Sort by ord
                domainsTrimmed.sort(function(a,b){
                    return a.ord - b.ord;
                });
                
                // Calculate difference between orders to detect spacers
                domainsTrimmed[0].difference = 0;
                for(var i = 0; i < domainsTrimmed.length - 1; i++){
                    domainsTrimmed[i + 1].difference = domainsTrimmed[i + 1].ord - domainsTrimmed[i + 0].ord - 1;
                }
                
                var width = domainsTrimmed.reduce(function(acc,val){
                    return acc + val.cells + val.difference;
                }, 0);
                
                return width;
            /*}
            
            return width;*/
        },
        
        /**
         * Render the view
         */
        parse:function(data){
            var thisModel = this;
        }
    });
    return Model;
});