/* global application */

define(["hub-lib"], function(Hub){
    
    function getUserPreference(prefName, programState, defaultVal){
        var pref = getPreference(prefName);
        if(pref === null){
            var msg = "Could not find preference: " + prefName + ". Please give preference to user's group.";
            console.warn(msg);
            pref = defaultVal;
        }
        return pref;
    }
    
    /**
     * Render the new graph type
     * @param {any[]} prefs - the preferences
     */
    function renderNewGraphType(prefs){
        var graphManager = application.graphstate;
        
        // Bypass safety to get graph
        var graphDef = graphManager._activeStack[0].definition;
        
        
        // Construct graph
        var graph = {
            id: graphDef.graphID,
            class: ["map-0"],
            animate: false,
            indirect: true,
            nodes: []
        };
        
        var nodeCollection = application.datainterface.get("node");
        graph.nodes = graphDef.newGraph.nodes.map(function(node){
            if(nodeCollection.has(node.nodeid)){
                var model = nodeCollection.get(node.nodeid);
                return {
                    id: node.nodeid,
                    text: model.getTitle(prefs.shownodeid, false),
                    color: node.color,
                    stroke: node.edgecolor,
                    strokewidth: 2,
                    radius: node.radius,
                    font: prefs.font
                };
            }else{
                return null;
            }
        }).filter(function(d){
            return (d !== null);
        });
        /*var node = nodeCollection.get(id);
        return {
            id: node.id,
            text: node.getTitle(prefs.shownodeid, false),
            color: "white",
            stroke: color,
            strokewidth: 2,
            radius: 50,
            font: prefs.font
        };*/
        
        // Get the transform
        var transform = appstate.get("activeGraphTransform");
        if(transform !== null){
            switch(transform){
                case "center":
                    graph.transform ={
                        x: 0,
                        y: 0, 
                        scale: 1
                    };
                    graph.animate = true;
                    break;
                default:
                    throw Error("unknown value for transform");
            }
        }
        appstate.set("activeGraphTransform", null, {silent:true});
        
        application.svgs["active"]
                .prepare(graph)
                .draw();
        
        return Promise.resolve(true);
    }
    
    /**
     * Render the svg defined by the given graph handle.
     * @param {Object} graphHandle
     * @param {Object} programState
     * @param {Object} options
     * @param {boolean} options.showselectedcircle 
     * @param {boolean} options.showtargettedcircle
     * @param {boolean} options.showselectededge
     * @returns {Promise}
     */
    function renderSvg(graphHandle, programState, renderID, options, ignoreLock){         
        hub.sendUserNotification("Rendering map.");
        
        options = (!options) ? {} : options;
        options.showselectedcircle = (typeof options.showselectedcircle === 'undefined') ? true : false;
        options.showtargettedcircle = (typeof options.showtargettedcircle === 'undefined') ? true : false;
        options.showselectededge = (typeof options.showselectededge === 'undefined') ? true : false;
        
        // Get preferences
        var prefs = {};
        prefs.shownodeid = (getUserPreference("NODEID_ON", programState).localeCompare("t") === 0);
        prefs.showindirect = (getUserPreference("INDIR_ON", programState) == "t");
        prefs.font = getUserPreference("FONT_G", programState, "Trebuchet");
        prefs.minfont = (getUserPreference("MINNDFONT", programState, "8pt"));
        
        prefs.shownodetext = getPreference("NODETXT_ON");
        prefs.shownodetext = (prefs.shownodetext === null) ? true : (prefs.shownodetext.localeCompare("t") === 0);
                
        switch(prefs.font){
            case "Courier New":
                prefs.font = "'Courier New', Courier, monospace";
                prefs.file = gRoot + "svg/text-manager/fonts/courier.html";
                break;
            case "Trebuchet":
                prefs.font = "Trebuchet, Helvetica, Arial, sans-serif";
                prefs.file = gRoot + "svg/text-manager/fonts/helvetica.html";
                break;
            default:
                throw Error("unknown font type: " + prefs.font);
        }
        
        if(prefs.font !== application.svglib._fontFamily){
            application.svglib._fontFile = prefs.file;
            application.svglib._fontFamily = prefs.font;
            return application.svglib.load().then(function(){
                return renderSvg(graphHandle, programState, renderID, options);
            });
        }


        var colorNodes = [];
        var graphManager = application.graphstate;
        
        
        
        // Push graph, grab def, pop graph
        assert(graphManager.push(graphHandle));
        if(graphManager.isNewGraph()){
            lockSite(false, lockID);
            return renderNewGraphType(prefs);
        }
        
        var graphDef = graphManager.get();
        assert(graphManager.pop());
        
        
        // Get the nodes from the server model
        //if(serverModel){
            //colorNodes = serverModel.getNodes();
        //}
        
        
        var targettedCircles = (options.showtargettedcircle) ? appstate.get("targettedcircles") : null;
        var selectedCircles = (options.showselectedcircle) ? appstate.get("selectedcircles") : null;

        // Construct graph
        var graph = {
            nodefont: prefs.font,
            minnodefontsize: prefs.minfont,
            id: graphDef.graphID,
            class: [graphHandle],
            animate: false,
            indirect: prefs.showindirect,
            nodes: []
        };
        
        if(renderID === 'active'){
            // Get the transform
            var transform = programState.get("activeGraphTransform");
            if(transform !== null){
                switch(transform){
                    case "center":
                        graph.transform ={
                            x: 0,
                            y: 0, 
                            scale: 1
                        };
                        graph.animate = true;
                        break;
                    default:
                        lockSite(false, lockID);
                        throw Error("unknown value for transform");
                }
            }
            programState.set("activeGraphTransform", null, {silent:true});
        }
        
        // Get the node collection
        var nodeCollection = Hub.get("node");
        var lst = graphDef.arr;
        
        // Build the new node
        function newNode(id, color){
            if(!nodeCollection.has(id)){
                lockSite(false, lockID);
                return null;
            }
            var node = nodeCollection.get(id);
            return {
                id: node.id,
                text: (prefs.shownodetext) ? Hub.stripHtml(Hub.wrap(node).title(false, prefs.shownodeid)) : "",
                color: "white",
                stroke: color,
                strokewidth: 2,
                radius: 50,
                shape: "circle"
            };
        }
        
        while(lst.length > 0){
            for(var i = 0; i < lst.length; i++){
                var n = lst[i];
                switch (n.state){
                    case "chonly":
                        var p = graph.nodes.find(function(d){
                            return (d.id == n.c);
                        });

                        if(typeof p !== 'undefined'){
                            if(!p.hasOwnProperty("parents")){
                                p.parents = [];
                            }
                            p.parents.push(n.id);
                            graph.nodes.push(newNode(n.id, "gray"));
                            lst.splice(i,1); i--;
                        }
                        break;
                    case "ponly":
                        var p = graph.nodes.find(function(d){
                            return (d.id == n.p);
                        });

                        if(typeof p !== 'undefined'){
                            if(!p.hasOwnProperty("children")){
                                p.children = [];
                            }
                            p.children.push(n.id);
                            graph.nodes.push(newNode(n.id, "gray"));
                            lst.splice(i,1); i--;
                        }
                        break;
                    case "red":
                    case "blue":
                    case "gray":
                    case "green":
                    case "orange":
                        graph.nodes.push(newNode(n.id, n.state));
                        lst.splice(i,1); i--;
                        break;
                    default:
                        throw Error("invalid state: " + n.state);
                }
            }
        }
        
        // Num nodes
        /*var numBlue = graph.nodes.filter(function(d){
            return (d.stroke == "blue");
        }).length;
        var numRed =  graph.nodes.filter(function(d){
            return (d.stroke == "red");
        }).length;*/

        // Isolate a single selected circle
        if(selectedCircles !== null && selectedCircles.length > 0){
            assert(selectedCircles.length === 1);
            selectedCircles = selectedCircles.at(0).id;
        }
        
        if(selectedCircles !== null || targettedCircles !== null){
            graph.nodes.forEach(function(d){
                // If this node is the selected node or is one of the targetted nodes
                if(d.id === selectedCircles || targettedCircles.has(d.id)){
                    
                    
                    // If this node is the selected circle
                    if(d.id === selectedCircles){
                         d.strokewidth = 15;
                         
                         
                    // If this node is one of the targetted nodes    
                    }else if(targettedCircles.has(d.id)){
                         // If there is only one targetted circle then show its icons, otherwise require selection
                         if(targettedCircles.length === 1){
                             d.class = ((d.hasOwnProperty("class")) ? d.class : []).concat(["showicons"]);
                         }else{
                             d.class = ((d.hasOwnProperty("class")) ? d.class : []).filter(function(c){
                                return (c !== "showicons");
                             });
                         }
                         d.strokewidth = 10;
                    }
                     
                // If this node is not the selected node and is not of the targetted nodes     
                }else{
                     d.class = ((d.hasOwnProperty("class")) ? d.class : []).filter(function(c){
                         return (c !== "showicons");
                     });
                }
            });
        }
        
        var mapClasses = graph.class.filter(function(d){
           return (d.split("map-").length > 1); 
        });
        assert(mapClasses.length <= 1);
        return drawSvg(renderID, graph, null, ignoreLock);
    };
    
    function drawSvg(renderID, graph, lockID, ignoreLock){
        if(ignoreLock !== true){
            if(typeof lockID === "undefined" || lockID === null){
                var lockID = lockSite(true, "svg-interface.js::drawSvg");
                setTimeout(function(){
                    drawSvg(renderID, graph, lockID, ignoreLock);
                }, 1);
                return Promise.resolve(true);
            }
        }
        
        // Render
        application.svgs[renderID]
                .prepare(graph)
                .draw();

        
        if(ignoreLock !== true){
            lockSite(false, lockID);
        }
        return Promise.resolve(true);
    }
    
    return renderSvg;
});

