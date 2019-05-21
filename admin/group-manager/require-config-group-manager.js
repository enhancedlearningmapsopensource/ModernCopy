

require.config({
    baseUrl: gRoot + "../moderncopy/",
    // packages:[{
    //     name: 'io',
    //     location: "../modernadmin/admin-main/managers/group-manager/lib/io",
    //     main: 'io-main'
    // }],
    paths: {
        backbone: "external-lib/backbonejs/debug/v1.3.3/backbone",
        //blobstream: "../external-lib/blob-stream/v0.1.3/blob-stream",
        bootstrap: "external-lib/bootstrap/bootstrap-3.3.7/js/bootstrap.min",
        //d3: "../external-lib/d3/kmap-original/d3",
        //dagre: "../external-lib/dagre/kmap-original/dagre",
        //dagre2: "../external-lib/dagre/v0.7.4/dist/dagre",
        //dmupload: "../external-lib/dmuploader/v0.1/dmuploader",
        //graphlib: "../external-lib/graphlib/v2.1.1/dist/graphlib.min",
        //jstorage: "../external-lib/js-storage/init/js.storage.min",
        jquery: "external-lib/jquery/v3.2.1/jquery.min",
        //lzstring: "../external-lib/lz-string/v1.4.4/lz-string-min",
        //math: "../external-lib/mathjs/v3.8.1/math.min",
        mustache: "external-lib/mustachejs/v2.2.1/mustache.min",
        underscore: "external-lib/underscorejs/debug/v1.8.3/underscore",
        jsclass: "external-lib/jsclass/require/require",   
        //elementqueries: "../external-lib/css-element-queries/v0.4.0/src/ElementQueries",
        //qunit: "../external-lib/qunit/v2.4.0/qunit",
        //resize: "../external-lib/css-element-queries/v0.4.0/src/ResizeSensor",
        //text: "../external-lib/textjs/v2.0.15/text",
        //velocity: "../external-lib/velocityjs/v1.5.0/velocity.min",
        //fuzzysearch: "../external-lib/fuzzysearch/v0/index",
        "lib": "admin/group-manager/lib",
        "text": "external-lib/textjs/v2.0.15/text"
    },
    shim: {
        bootstrap : {
            deps :['jquery'] 
        }
    }
});

var importer = null;
if(typeof loadComplete !== 'function' || !loadComplete){
    console.warn("defining a function called 'loadComplete' will allow a callback when requirejs is finished.");
}

var pageView = null;
var state = null;

require(["lib/page", "backbone", "bootstrap"], function(PageView, Backbone){
    state = new Backbone.Model({
        id: 'state'
    });
    pageView = new PageView({el: $("#page-container")[0], model: new Backbone.Model(), data: data});
    pageView.render();
    state.set({
        activeGroup: 1,
        activeCategory: 'preferences'
    });
    
});  

