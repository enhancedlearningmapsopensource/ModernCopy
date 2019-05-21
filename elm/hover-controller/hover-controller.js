define(["hub-lib", "jquery", "activeGraph"], function(Hub, $, ActiveGraph){
    return {
        
        clearNodes: function(){
            $("#graph-wrapper > svg > g > g > g > circle").attr("fill", "white");
        },
        
        clearEdges: function(){
            $("#graph-wrapper > svg > g path[fill='none']").attr("opacity", 0.01);
        },
        
        clear: function(){
            var thisObj = this;
            thisObj.clearNodes();
            thisObj.clearEdges();
        },
        
        isHilightOn: function(){
            // Check permissions
            for(var i = 0; i < permissions.length; i++){
                if(permissions[i] === "HILI"){
                    var pref = getPreference("HILI_ON");
                    return (pref === "t");
                }
            }
            return false;
        },
        
        getNodeCoords: function($node){
            var transform = $node.parent().attr("transform");
            var translate = transform.split(")")[1].trim();
            var coords = translate.split("(")[1].trim().split(" ");
            
            var x = Number(coords[0].trim());
            var y = Number(coords[1].trim());
            return {
                x: x,
                y: y
            };
        },
        
        /*getEdgeCoords: function($edge){
            var thisObj = this;
            if(!thisObj.hasOwnProperty("edgesets")){
                thisObj.edgesets = {};
            }
            
            var d = $edge.attr("d");
            
            d = d.split("L").join(",");
            d = d.split("C").join(",");
            
            if(d[0] === "M"){
                d = d.slice(1);
            }
            
            var vals = d.split(",").map(function(f){
                return Number(f);
            });
            
            return {
                start: {
                    x: vals[0],
                    y: vals[1]
                },
                end: {
                    x: vals[vals.length - 2],
                    y: vals[vals.length - 1]
                }
            };
        },*/
        
        start: function(){
            var thisObj = this;
            thisObj.consts = {
                colors: {
                    "blue": "#c0c0ff",
                    "red": "#f2b9b9"
                }
            };
            
            $(document).on("mouseover", "#graph-wrapper > svg > g > g > g > circle", function(e){
                if(thisObj.isHilightOn()){
                    var $el = $(e.currentTarget);
                    //var $parent = $el.parent();
                    //var id = Number($parent.attr("id").split("node-")[1]);
                    thisObj.highlightEdges($el);
                }
                //thisObj.highlightNodes($el);
            });
            
            $(document).on("mouseout", "#graph-wrapper > svg > g > g > g > circle", function(e){
                if(thisObj.isHilightOn()){
                    thisObj.clear();
                }
                //$("#graph-wrapper > svg > g path[fill='none']").attr("opacity", 0.01);
                //$("circle").attr("fill", "white");
            });
            
            $(document).on("mouseover", "#graph-wrapper > svg > g path", function(e){
                if(thisObj.isHilightOn()){
                    var $el = $(e.currentTarget);
                    //var $parent = $el.parent();
                    //var id = Number($parent.attr("id").split("node-")[1]);
                    thisObj.highlightNodes($el);
                    //thisObj.highlightNodes($el);
                }
            });
            
            $(document).on("mouseout", "#graph-wrapper > svg > g path", function(e){
                if(thisObj.isHilightOn()){
                    thisObj.clear();
                }
                //$("#graph-wrapper > svg > g path[fill='none']").attr("opacity", 0.01);
                //$("circle").attr("fill", "white");
            });
        },
        
        highlightNodes: function($edge){
            var thisObj = this;
            thisObj.clear();
            
            var $path = $edge.parent().find("path[fill='none']");
            var s = $path.attr("s");
            var t = $path.attr("t");
            
            var colors = [];
            var xs = [];
            [s,t].forEach(function(n){
                var $node = $("#graph-wrapper > svg #node-" + n + " > circle");
                var c = $node.attr("stroke");
                var coords = thisObj.getNodeCoords($node);
                xs.push(coords.x);
                colors.push(c);
                $node.attr("fill", thisObj.consts.colors[c]);
            });
            
            if(xs[0] > xs[1]){
                colors.reverse();
            }
            
            $edge.attr("opacity", 0.25);
            if(colors[0] === colors[1]){
                $edge.attr("stroke", colors[1]);
            }else{
                $edge.attr("stroke", "url(#grad_"+colors[0]+colors[1]+")");
            }
            
            
            
            /*return;
            
            
            var $nodeT = $("#graph-wrapper > svg #node-" + t + " > circle");
            $nodeT.attr("fill", thisObj.consts.colors[$nodeT.attr("stroke")]);
            
            return;
            var thisObj = this;
            $("circle").attr("fill", "white");
            
            var id = Number($node.parent().attr("id").split("node-")[1]);
            
            var visibleNodes = ActiveGraph.getNodes(appstate);
            
            // Get hub model
            var model = Hub.get("node").get(id);
            
            // Get parents
            var parents = Hub.wrap(model).getParentIDs();
            var children = Hub.wrap(model).getChildrenIDs();
            
            var toHighlight = parents.concat(children);
            removeDuplicates(toHighlight);
            
            toHighlight = toHighlight.filter(function(d){
                for(var i = 0; i < visibleNodes.length; i++){
                    if(visibleNodes[i] === d){
                        return true;
                    }
                }
                return false;
            });
            
            toHighlight = ActiveGraph.getNodeColor(appstate, toHighlight);
            toHighlight.forEach(function(node){
                var $relative = $("#graph-wrapper > svg #node-" + node.node + " > circle");
                $relative.attr("fill", thisObj.consts.colors[node.color]);
            });*/
        },
        
        highlightEdges: function($node){
            var thisObj = this;
            thisObj.clear();
            //$("#graph-wrapper > svg > g path[fill='none']").attr("opacity", 0.01);
            //$("circle").attr("fill", "white");
            
            var id = Number($node.parent().attr("id").split("node-")[1]);
            //var nodeCoords = thisObj.getNodeCoords($node);
            
            var color = $node.attr("stroke");
            var edges = $("#graph-wrapper > svg > g path[t='"+id+"'], #graph-wrapper > svg > g path[s='"+id+"']");
            //edges.attr("opacity", 0.25);
            //edges.attr("stroke", color);
            
            var nodes = [];
            edges.each(function(e){
                var $edge = $(this);
                var s = Number($edge.attr("s"));
                var t = Number($edge.attr("t"));
                
                if(s !== id){
                    nodes.push({
                        node: s,
                        $edge: $edge
                    });
                }else if(t !== id){
                    nodes.push({
                        node: t,
                        $edge: $edge
                    });
                }else{
                    throw Error("Both equal to id.");
                }
            });
            
            var ids = nodes.map(function(d){return d.node;});
            var toHighlight = ActiveGraph.getNodeColor(appstate, ids);
            nodes.forEach(function(d,i){
                assert(toHighlight[i].node === nodes[i].node);
                nodes[i].color = toHighlight[i].color;
            });
            nodes.forEach(function(node){
                var $relative = $("#graph-wrapper > svg #node-" + node.node + " > circle");
                $relative.attr("fill", thisObj.consts.colors[node.color]);
                node.$edge.attr("opacity", 0.25);
                node.$edge.attr("stroke", node.color);
                //$relative.attr("opacity", 0.25);
            });
            /*return;
            
            
            // Get all edges associated with node
            var edges = [];
            $("#graph-wrapper > svg > g path").each(function(e){
                var $edge = $(this);
                if($edge.attr("pointer-events") !== "none"){
                    $edge.attr("opacity", 0.01);
                    var edgeCoords = thisObj.getEdgeCoords($edge);
                    
                    var diff = thisObj.magVec2(thisObj.subVec2(nodeCoords, edgeCoords.start));
                    if(diff < 0.001){
                        edges.push($edge);
                    }else{
                        diff = thisObj.magVec2(thisObj.subVec2(nodeCoords, edgeCoords.end)) - Number($node.attr("r"));
                        if(diff < 0.001){
                            edges.push($edge);
                        }
                    }
                    
                    
                }
            });
            
            var color = $node.attr("stroke");
            edges.forEach(function($edge){
                $edge.attr("stroke", color);
                $edge.attr("opacity", 0.25);
            });*/
        }
        
        /*subVec2(a, b){
            var x = (a.x - b.x);
            var y = (a.y - b.y);
            return {
                x: x,
                y: y
            };
        },
        
        magVec2(v){
            return Math.sqrt((v.x*v.x) + (v.y*v.y));
        }*/
        
    };
});


