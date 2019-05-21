define(["backbone"], function(Backbone){
    var Searcher = Backbone.Model.extend({
        binarySearch: function(map, l, r, x) {
            var thisView = this;
            if (r >= l){
                var mid = Math.floor(l + (r - l)/2);

                // If the element is present at the 
                // middle itself
                if (map[mid].key === x){
                    return mid;
                }

                // If element is smaller than mid, then 
                // it can only be present in left subarray
                if (map[mid].key > x){
                    return thisView.binarySearch(map, l, mid-1, x);
                }

                // Else the element can only be present
                // in right subarray
                return thisView.binarySearch(map, mid + 1, r, x);
            }

            // We reach here when element is not present
            //  in array
            return -1;
        },
        
        search: function(id){
            throw Error("child must implement");
        }
    });
    
    Searcher.extend = function (child) {
	var ex = Backbone.Model.extend.apply(this, arguments);
	ex.prototype.events = _.extend({}, this.prototype.events, child.events);
	return ex;
    };
    
    var searchers = {
        
    };
    
    Searcher.searchTable = function(name, id, implementation){
        var searcher = null;
        if(searchers.hasOwnProperty(name)){
            searcher = searchers[name]; 
        }else{
            searcher = new implementation();
            searchers[name] = searcher;
        }
        return searcher.search(id);
    };
    
    return Searcher;
});