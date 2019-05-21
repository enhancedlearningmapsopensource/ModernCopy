/**
 * Usage:
 * 

    // Set the master graph
    SvgLib.setMasterGraphFile('edges.php');

    //Define the graph options:
    var graphOptions = {
        handlers:{
            click:{
                node: function(a,b,c){},
                icon: function(a,b,c){}
            }
        }
    };

    // Find the element that will contain the graph:
    var $graphEl = $("#svg-graph");

    // Allocate space for the new graph
    var graphManager = SvgLib.allocate($(this), graphOptions);

    // Build the graph
    var graph = {
        id: 12,
        nodes: [{
            id: 6,text: "node 6",color: "white",stroke: {color: "black",width: 2,},radius: 100
        },
        {
            id: 4,text: "node 4",color: "white",stroke: {color: "black",width: 2,},radius: 100
        }]
    };

    // Prepare for render
    graphManager.prepare(graph);

    // Draw the graph
    graphManager.draw();

 */

define(["jquery",
        "jsclass!3rdParty/jsclass/",
        "./manager", 
        "./edge-fabricator/edge-fabricator", 
        "./graph-planner/graph-planner", 
        "./text-manager/text-manager",
        "./icon-node"/*,  // Load in case its neeed for override
        "elementqueries"*/],
function($, JsClass, Manager, EdgeFabricator, GraphPlanner, TextManager, IconNode){
    class SvgLibrary{
        constructor(){
            var thisClass = this;
            thisClass.graphManagers = [];
            thisClass.controlledDomNodes = new JsClass.Hash();
            thisClass._fabricator = null;
            thisClass._planner = new GraphPlanner();
            thisClass._text = new TextManager();
            thisClass._fontFamily = null;
            thisClass._fontFile = null;
        }
        
        load(){
            var thisClass = this;
            return Promise.resolve();
        }

        /**
         * @param {elem|$(elem)|array} el - element to begin controlling
         * @param {Object} options
         * @param {Object[]}} options.handlers - handlers for events
         * @param {function[]}} options.handlers.click - handlers for click events
         * @param {(number, SvgNode)=>void} options.handlers.click.node - handler for node clicks
         * @param {(number, SvgEdge)=>void} options.handlers.click.edge - handler for edge clicks
         * @param {(any*)=>SvgNode} options.overrides - constructors used to override object
         * @param {(any*)=>SvgNode} options.overrides.node - node override object
         * @param {boolean} options.notext - prevent node text in graph
         * @param {string} options.nodefont - if provided, this will override the node font settings
         * @return {GraphManager} - the graph manager for the given element
         */
        allocate(el, options){
            var thisClass = this;

            if(typeof thisClass._fabricator === 'undefined' || thisClass._fabricator === null){
                throw Error("master graph has not been provided");
            }

            if(el instanceof $){
                return thisClass.allocate(el[0], options);
            }else if($.isArray(el)){
                return el.map(function(d){
                    return thisClass.allocate(d, options);
                })
            }

            var $el = $(el);
            if(thisClass.controlledDomNodes.hasKey($el)){
                throw Error("already controlled");
            }

            // Look for avaliable managers
            var avaliableManager = thisClass.graphManagers.reduce(function(acc, val){
                return (acc !== null) ? acc : (val.isUnused() ? val : acc);
            }, null);
            
            // Gather options
            options = (!options) ? {} : options;
            options.notext = (typeof options.notext === 'undefined' || options.notext === null) ? false : options.notext;
            var managerOptions = {
                handlers: options.handlers,
                overrides: options.overrides,
                nodefont: options.nodefont,
                minnodefontsize: options.minnodefontsize
            };
            
            // Gather utilities for initialization
            var utilities = {
                fabricator: thisClass._fabricator,
                planner: thisClass._planner,
                options: managerOptions
            };
           
            // Add the text manager
            if(options.notext === false){
                utilities.textManager = thisClass._text;
            }

            // If one is NOT avaliable then create a new one
            if(avaliableManager === null){
                avaliableManager = new Manager(thisClass.graphManagers.length, $el, utilities);//thisClass._fabricator, thisClass._planner, thisClass._text);
                thisClass.graphManagers.push(avaliableManager);
            }
            
            // Otherwise re-bind the element
            else{
                avaliableManager.bind($el, managerOptions);
            }   

            // Record the reference
            thisClass.controlledDomNodes.store($el, avaliableManager);
            return avaliableManager;
        }
        
        /**
         * Provides a way to get the icon node constructor. This is a patch until a better solution can be found
         * @return {IconNode}
         */
        getIconNodeConstructor(){
            return IconNode
        }
        
        /**
         * Exposes the edgefabricator for external use
         * @returns {EdgeFabricator}
         */
        edgeFabricator(){
            return this._fabricator;
        }

        /**
         * 
         * @param {elem|$(elem)|array} el - element to begin controlling
         */
        release(el){
            var thisClass = this;
            if(el instanceof $){
                return thisClass.release(el[0]);
            }else if($.isArray(el)){
                return el.map(function(d){
                    return thisClass.release(d);
                })
            }

            var $el = $(el);
            if(thisClass.controlledDomNodes.hasKey($el)){
                thisClass.controlledDomNodes.remove($el);
            }
        }

        /**
         * Set the master graph used to determine relationships between nodes
         * @param {string|Object} graphData - either the raw data from the edge query or the edge fabricator object
         */
        setMasterGraph(graphData, path){
            var thisClass = this;
            if(graphData !== null && typeof graphData === 'object'){
                thisClass._fabricator = graphData;
            }else{
                thisClass._fabricator = new EdgeFabricator(graphData, path);
            }
        }   
        
        /**
         * Set the master graph from a file.
         * @param {string} path - the path to the graph e.g. path.php
         * @return {Promise} - completion
         */
        setMasterGraphFile(path){
            var thisClass = this;
            return new Promise(function(resolve, reject){
                $.get(path, function(ret){
                    thisClass.setMasterGraph(ret, path);
                    resolve(); 
                });
            });
        }
    }

    if(typeof singleton === 'undefined'){
        var singleton = new SvgLibrary();
    }
    return singleton;
});

if(typeof notify === 'function'){
    notify("svg/main:: SvgModule main file contacted.");
}