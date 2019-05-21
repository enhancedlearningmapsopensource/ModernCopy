require.config({
    paths: {
        backbone: "external-lib/backbonejs/debug/v1.3.3/backbone",
        blobstream: "external-lib/blob-stream/v0.1.3/blob-stream",
        bootstrap: "external-lib/bootstrap/bootstrap-3.3.7/js/bootstrap.min",
        d3: "external-lib/d3/kmap-original/d3",
        dagre: "external-lib/dagre/kmap-original/dagre",
        dagre2: "external-lib/dagre/v0.7.4/dist/dagre",
        dmupload: "external-lib/dmuploader/v0.1/dmuploader",
        elementqueries: "external-lib/css-element-queries/v0.4.0/src/ElementQueries",
        graphlib: "external-lib/graphlib/v2.1.1/dist/graphlib.min",
        jstorage: "external-lib/js-storage/init/js.storage.min",
        jquery: "external-lib/jquery/v3.2.2/-effects/jquery.min",
        jsclass: "external-lib/jsclass/require/require",
        lzstring: "external-lib/lz-string/v1.4.4/lz-string-min",
        math: "external-lib/mathjs/v3.8.1/math.min",
        mustache: "external-lib/mustachejs/v2.2.1/mustache.min",
        qunit: "external-lib/qunit/v2.4.0/qunit.js",
        resize: "external-lib/css-element-queries/v0.4.0/src/ResizeSensor",
        text: "external-lib/textjs/v2.0.15/text",
        velocity: "external-lib/velocityjs/v1.5.0/velocity.min",
        underscore: "external-lib/underscorejs/debug/v1.8.3/underscore"
    },
    shim: {
        jquery: {
            exports: "jQuery"
        },
        backbone:{
            init: function(){
                this.emulateHTTP = false;
                this.emulateJSON = false;
            },
            deps: ['underscore', 'jquery']
        },
        bootstrap : {
            deps :['jquery'] 
        },
        d3: {
            exports: "d3"
        },
        dagre: {
            exports: "dagre"
        },
        //pdfkit:{
        //    deps: ['blobstream']
        //},
        mustache:{
            exports: "Mustache"
        },
        elementqueries:{
            exports: "ElementQueries",
            deps: ['resize']
        },
        resize:{
            exports: "ResizeSensor"
        },
        tinyMCE: {
            exports: 'tinyMCE',
            init: function () {
                this.tinyMCE.DOM.events.domLoaded = true;
                return this.tinyMCE;
            }
        }
    }
});
if(typeof notify === 'function'){
    notify("require-config:: Library file contacted.");
}