// Require setup used to dislay map, menus, and standards grid.
require.config({
    // Set base url to the elm folder
    baseUrl: gRoot,
    packages:[
        // Cascade libraries
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
    ],
    paths: {        
        /**
         * Library Paths
         */
        requiremain: "../elm/corestate/js/require/require-config-main"
    }
});

require(["requiremain"], function(){

});