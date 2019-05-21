define(["jsclass!admin-main/js-class-require/"], function(JsClass){
    class EdgeGraphFactory{
        constructor(){
            var thisClass = this;
        }
        
        /**
         * Creates an edge graph from the provided details
         * @return {string} - the edge graph
         */
        create(){
            var thisClass = this;
            var edgeData = {
                edgecnt: 0,
                edges: []
            };
            
            thisClass._parentToChildren.forEach(function(item){
                var parent = item.key;
                var children = item.value.map(function(d){return d;});
                edgeData.edges.push({"p": parent, "c": children});
                edgeData.edgecnt += children.length;
            });
            
            return JSON.stringify(edgeData);
            
            //"{"edgecnt":12699,"edges":[{"p":100,"c":[105,106,10
        }
        
        /**
         * Add edges between a parent and a set of children
         * @param {number} parent - the parent
         * @param {number[]} child - the children
         */
        addEdges(parent, children){
            assertType(parent, "number");
            assertType(children, "number[]");
            
            
            var thisClass = this;
            
            // If there is no record of this parent add one
            if(!thisClass._parentToChildren.hasKey(parent)){
                thisClass._parentToChildren.store(parent, new JsClass.Set());
            }
            
            // Add the children
            children.forEach(function(child){
                thisClass._parentToChildren.fetch(parent).add(child);
            });
        }
        
        
        /**
         * Clears the factory in preparation for building a new edge-graph
         */
        reset(){
            var thisClass = this;
            thisClass._parentToChildren = new JsClass.Hash();
        }
    }
    
    return EdgeGraphFactory;
})


