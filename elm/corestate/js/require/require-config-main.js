var application = {};   // The application
var appstate = null;    // The application program state (alias for application.programState)
var testSvgModule = true;
var ERR_REP = false;
var VERBOSE = false;
var VERSION = "1.037";	// From 12/1/2017
var locks = null;
var lockNames = null;
var rollingLockID = 0;
var times = [];

let packages = [
    {
        name: "svg-lib",
        location: "svg",
        main: "main"    
    },
    // {
    //     name: "resource-manager",
    //     location: "../../modern_resourcemanager/resource-manager",
    //     main: "main-dead"
    // },
    {
        name: "hub-lib",
        location: "../hub",
        main: "main"
    },
    {
        name: "search-engine-lib",
        location: "search-engine-final",
        main: "main"
    },
    {
        name: "ranker-lib",
        location: "ranker",
        main: "main"
    },
    {
        name: "map-manager-lib",
        location: "map-manager",
        main: "map-manager-main"
    },
    {
        name: "standards-page",
        location: "standards-page",
        main: "main"
    },
    {
        name: "navbar-lib",
        location: "navbar",
        main: "main"
    },
    {
        name: "core",
        location: "../database/core",
        main: "main"
    },
    {
        name: "map-view-panel",
        location: "map-view-panel",
        main: "main"
    },
    {
        name: "site-lib",
        location: "site",
        main: "site"
    }
];

// Cascade libraries
if(loadCascade){
    packages = packages.concat([
        {
            name: "cascade-lib",
            location: "../cascade/src",
            main: "main"
        },{
            name: "cascade-plugin",
            location: "../cascade-plugin",
            main: "main"
        },{
            name: "aura",
            location: "../aura/src",
            main: "aura-main"
        },{
            name: "aura-utility",
            location: "../aura/utility",
            main: "utility-main"
        }
    ]);
}


// Require setup used to dislay map, menus, and standards grid.
require.config({
    urlArgs: "v=" + VERSION,

    // Set base url to the elm folder
    baseUrl: gRoot,

    packages: packages,
    paths: {        
        /**
         * Library Paths
         */
        backbone: "../external-lib/backbonejs/release/v1.3.3/backbone.min",
        bootstrap: "../external-lib/bootstrap/bootstrap-3.3.7/js/bootstrap.min",
        d3: "../external-lib/d3/kmap-original/d3",
        dagre: "../external-lib/dagre/kmap-original/dagre",
        dagre2: "../external-lib/dagre/v0.7.4/dist/dagre",
        fuzzysearch: "../external-lib/fuzzysearch/v0/index",
        graphlib: "../external-lib/graphlib/v2.1.1/dist/graphlib.min",
        immutable: "../external-lib/immutable/immutable.min",
        jquery: "../external-lib/jquery/v3.2.1/jquery.min",
        lzstring: "../external-lib/lz-string/v1.4.4/lz-string-min",
        mustache: "../external-lib/mustachejs/v2.2.1/mustache.min",
        underscore: "../external-lib/underscorejs/debug/v1.8.3/underscore",
        jsclass: "../external-lib/jsclass/require/require",   
        qunit: "../external-lib/qunit/v2.4.0/qunit",
        text: "../external-lib/textjs/v2.0.15/text",
        velocity: "../external-lib/velocityjs/v1.5.0/velocity.min",
        
        
        /**
         * Search Engine
         */
        "srch" : "search-engine",
        
        /**
         * Path to database library
         */
        "database" : "../database/",
        
        /**
         * Application Paths
         */
        "main": "corestate/js/require/main",
        "activeGraph": "corestate/_misc/active-graph-helper",
        "constants": "corestate/js/program-state/program-constants",
        "discussion-panel": "corestate/templates/site/windows/graph/side-panel/panels/map-discussion/lib/",
        "mapviews": "corestate/templates/site/windows/graph/side-panel/panels/my-map-views/js/",
        "resourceHelper": "corestate/_misc/resource-helper",
        "program-state": "corestate/js/program-state/program-state",
        "program-state-listener": "corestate/js/program-state/program-state-listener",
        "side-panel": "corestate/templates/site/windows/graph/side-panel",
        "ui": "corestate/js/ui",
        "graph-compressor": "corestate/js/graph-compression/graph-compression",
        "timing": "../database/timing",
        "common-functions": "../database/common-functions",
        "common": "../database/common-functions",
        "cascade-common": "../cascade/src/general-functions/cascade-common-functions",
        "cascade-plugin-tools": "../cascade-plugin-tools"
    },
    
    // Determine the load order
    shim: {
        "resource-manager":{
            deps: ["text"]
        },
        jquery: {
            exports: "jQuery"
        },
        backbone:{
            init: function(){
                this.emulateHTTP = false;
                this.emulateJSON = false;
            },
            deps: ["underscore", "jquery"]
        },
        bootstrap : {
            deps :["jquery"] 
        },
        d3: {
            exports: "d3"
        },
        dagre: {
            exports: "dagre"
        },
        mustache:{
            exports: "Mustache"
        },
        tinyMCE: {
            exports: "tinyMCE",
            init: function () {
                this.tinyMCE.DOM.events.domLoaded = true;
                return this.tinyMCE;
            }
        }
    }
});

/**
 * Output depending on the VERBOSE setting
 * @param {string} txt - text to output
 */
function notify(txt) {
    if (VERBOSE) {
        console.log(txt);
    }
}

function writeLog(s){
    
}

/**
 * Send a notification to the user
 * @param {string} txt - Text to display to the user
 */
function notifyUser(txt){
    if(typeof application !== "undefined" && application !== null && typeof application.site !== "undefined" && application.site !== null){
        application.site.notifyUser(txt);
    }else{
        $("#lockscreen #status").html(txt);
    }
}

function reportErrors(f){
    try{
        var result = f();
    }catch(err){
        throw Error(err.message);
    }
    if(result instanceof Promise){
        result.then(function(){})
            .catch(function(err){
                throw Error("caught promise");
            });
    }
}



/**
 * Lock/Unlock the site to prevent/allow user input
 * @param {boolean=true} lockOn - true locks the site, while false unlocks it
 * @param {number=|string} lockID|name - the id issued by a lock event (required to unlock) OR the name of the lock (required when lockOn=true)
 */
function lockSite(lockOn, lockID) {
    lockOn = (typeof lockOn === "undefined" || lockOn === null) ? true : lockOn;    
    assertType(lockOn, "boolean");

    if (lockOn) {
        assertType(lockID, "string");
        assertExists(lockNames);
        
        application.site.lock(true);
        if (!locks) {
            locks = new JsClass.Set();
        }
        var nextLockID = rollingLockID++;
        locks.add(nextLockID);
        lockNames.store(nextLockID, lockID);
        return nextLockID;
    } else {
        if (!locks || locks.length == 0) {
            throw Error("the site is not locked");
        }
        if (typeof lockID === "undefined" || lockID === null) {
            throw Error("cannot unlock the site without a lock id");
        }
        locks.remove(lockID);
        lockNames.remove(lockID);
        if (locks.length === 0) {
            application.site.lock(false);
        }
    }
}

// Clear all node highlighting
window.highlitnodes = [];

/**
 * Highlight all nodes with IDs in the given list.
 * @param {number[]} nodeIDs - The ids of the nodes to highlight.
 */
function highlightNodes(nodeIDs){
    assertType(nodeIDs, "number[]");
    nodeIDs.forEach(function(d){
        highlightNode(d);
    });
}

/**
 * Highlight the node with the given ID.
 * @param {number} nodeID - The id of the node to highlight 
 */
function highlightNode(nodeID){
    assertType(nodeID, "number");
    var $node = $("g#node-" + nodeID);
    if($node.length > 0){
        window.highlitnodes.push(nodeID);
        var $circle = $node.find("circle");
        var color = $circle.attr("stroke");
        var fill = null;
        switch(color){
        case "red": fill = "#f2b9b9"; break;
        case "blue": fill = "#c0c0ff"; break;
        case "gray": fill = "#c3c1c1"; break;
        }
        $circle.attr("fill", fill);
    }
}

/**
 * Unhighlight all nodes.
 */
function unhighlightNodes(){
    window.highlitnodes.forEach(function(n){
        var $node = $("g#node-" + n + " > circle");
        if($node.length > 0){
            $node.attr("fill", "white");
        }
    });
    window.highlitnodes = [];
}

// Clear any previous references to the hub
var hub = null;

// Preload data if necessary
if(typeof preloadedData !== "undefined"){
    require(["lzstring"], function(LzString){
        localStorage["elm-local-store"] = LzString.compress(preloadedData);
        require(["main"], function(){}, function (err) {throw Error();});
    });
}else{
    // Load the 'main' library (defined above). Doing this gives the main file a relative path and makes it easier to encapsulate.
    require(["main"], function(){}, function (err) {throw Error();});
}


