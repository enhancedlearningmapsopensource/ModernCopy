/**
 * @name corestate/js/program-state/program-constants
 */
define([
],function (
) {    
    var ProgramConstants = {
    /*subjects: {
        uppercase: subjects,
        lowercase: subjects.map(function (d) { return d.toLowerCase() }),
    },*/
        DEFAULT_NODE_FONT: "\"Courier New\", Courier, monospace",
        DEFAULT_NODE_SEPARATION: 30,
        DEFAULT_RANK_SEPARATION: 30,
        STRINGS: {
            CASCADE: "Student Location",
            CIRCLE: "node",
            EDGE: "connection",
            GRAPH: "map",
            CHANGE_COLOR: "change color",
            NO_ACTIVE_GRAPH_WARNING: "No active map loaded. Open a map to view data.",
            NO_RESOURCES_WARNING: "No resources were found for the selected map view.",
            UNSAVED_MAP_WARNING: "The active map is not saved.",
            ROSTER: "Student Locater Tool",
            SELECT_NODE: "about node",
            SELECT_EDGE: "about connection"
        },
        COLOR: {
            GREY: "gray",
            RED: "red",
            BLUE: "blue"
        },
        STATE_VARIABLES:{
            "c:selectedcircles": "sc",
            "c:targettedcircles": "tc",
            "o:dashboardOpen": "do",
            "o:edgegraphready": "egr",
            "o:feedbackOpen": "fo",
            "o:hidenonresmaps": "hr",
            "o:hidenonelmmaps": "he",
            "o:menuOpen": "mo",
            "o:navbarHelpDropdownOpen": "ho",
            "o:navbarUserDropdownOpen": "uo",
            "o:omniSearchOpen": "oo",
            "o:resourceManagerOpen": "rmo",
            "o:standardTableCellsSelectedDetailed": "stcsd",
            "s:activeGraphTransform": "agt",
            "s:activeGraph": "ag",
            "s:activeSet": "as",
            "s:activeSubject": "asb",
            "s:activeWindow": "aw",
            "s:selectedstandardcells": "ssc",
            "o:showallresources":"sar",
            "s:sidePanel":"sp",
            "s:sidePanelPrev":"spr",
            "s:standardcellsselected":"scs",
            "s:minimizedGraphs":"mg",
            "o:userguideOpen":"ugo",
            "o:videosOpen": "vo",
            "o:patchNotesOpen": "pno",
            "o:bugtrackerOpen": "bto",
            "s:selectededge": "se",
            "o:showdeletedmaps": "sdm",
            "o:overlay": "ov",
            "o:update": "up",
            "s:omnisearch": "os",
            "o:cascadeopen": "co",
            "o:sidepanelopen": "spo"
        }
    };

    ProgramConstants.INV_STATE_VARIABLES = {/* Filled below */};
    Object.keys(ProgramConstants.STATE_VARIABLES).forEach(function(k){
        if(ProgramConstants.INV_STATE_VARIABLES.hasOwnProperty(ProgramConstants.STATE_VARIABLES[k])){
            throw Error("Duplicate property: " + ProgramConstants.STATE_VARIABLES[k]);
        }
        ProgramConstants.INV_STATE_VARIABLES[ProgramConstants.STATE_VARIABLES[k]] = k;
    });

    return ProgramConstants;
});