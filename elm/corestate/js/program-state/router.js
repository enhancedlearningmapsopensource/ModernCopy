/* 
Set up and run the router. This is not a typical router set up and has evolved
over time. 
*/

/* global userID, appstate, application */

// Determine libraries to load
const coreLibraries = [
    "backbone",
    "site-lib",
    "corestate/js/program-state/program-state",
    "svg-lib",
    "hub-lib",
    "jsclass!external-lib/jsclass/",
    "corestate/js/graphs/graph-manager",
    "./edge-graph-factory",
    "constants",
    
    "../../../hover-controller/hover-controller"
];

const cascadeLibraries = [
    "cascade-lib",
    "cascade-plugin"
];

const objectFreeLibraries = [
    "bootstrap",
    "../../../persistent-connection/checker"
];

const libraryPaths = coreLibraries.concat(
    (loadCascade === true) ? cascadeLibraries : []
).concat(objectFreeLibraries);

define(
    libraryPaths, 
function(
    Backbone,
    Site,
    ProgramState,
    SvgLib,
    Hub,
    JsClass,
    GraphState,
    EdgeGraphFactory,
    cnst,
    
    HoverManager,
    Cascade,
    CascadePlugin
){
             
    var pvt = {
        reloadcalls: 0
    };
    
    /**
     * Build data interface for backwards compatibility.
     * @return {object}
     */
    function buildDataInterface(){
        
        // application.datainterface.get("user").get(appstate.get("userID")).get("email");
        return {
            /**
             * Get the tabel with the matching name.
             * @param {string} table - the table name.
             * @return {object} - the table.
             */
            get: function(table){
                switch(table){
                case "node": return Hub.get("node");
                case "user": return Hub.get("user");
                default: throw Error("Unknown table: " + table);
                }
            }
        };
    }
             
    var Router = Backbone.Router.extend({
        site: null,
        loading: false,
        
        routes: {
            "*vars" : "defaultRoute"
        },
        
        defaultRoute: function(vars){
            var thisRouter = this;

            // If the site is not already loading then load it
            if(thisRouter.site === null && !thisRouter.loading){
                thisRouter.loading = true;
                var s = timeNow();
                pvt.loadSite.call(thisRouter).then(function(site){
                    times.push({
                        name: "router.loadSite time",
                        time: timeNow() - s
                    });
                    thisRouter.site = site;
                    thisRouter.loading = false;
                    thisRouter.defaultRoute(vars);
                }).catch(function(err){
                    console.warn(err);
                    Hub.sendUserNotification("An error occured during page load. Please refresh your browser to continue. ");
                });
            }
            
            // If the router has already loaded then apply the url to the site state
            else if(!thisRouter.loading){  
                pvt.applyUrl.call(thisRouter, vars);
            }
        }
    });
    
    /**
     * Apply the variables contained in the url to the site. 
     * @param {string} url - the url
     */
    pvt.applyUrl = function(vars){
        if(vars !== null){
            var st = timeNow();

            var set = {};
            vars.split("&").forEach(function(d){
                var preSplit = d.replaceAll("\"","").replaceAll("\\","");
                
                
                var s = preSplit.split(":");
                if(s.length !== 3){
                    if(cnst.INV_STATE_VARIABLES.hasOwnProperty(s[0])){
                        s = cnst.INV_STATE_VARIABLES[s[0]].split(":").concat(s.slice(1));
                    }else{
                        console.warn("Invalid url attribute: d='"+d+"'. Ignoring attribute.");
                        return;
                    }
                }
                var json = s[2]
                    .replaceAll("[cq]", "[c][q]")
                    .replaceAll("[qc]", "[q][c]")
                    .replaceAll("[q]", "\"")
                    .replaceAll("[c]", ":");

                if(s[0] === "targettedcircles"){
                    throw Error();
                }

                switch(s[0]){
                case "c": // Backbone.Collection
                    appstate.get(s[1]).reset();
                    appstate.get(s[1]).add(JSON.parse(json));
                    break;
                case "n":
                    set[s[1]] = Number(json);
                    break;
                case "o":
                    set[s[1]] = JSON.parse(json);
                    break;
                case "s":
                    set[s[1]] = json;
                    break;
                default: 
                    throw Error("unrecognized type: " + s[0]);
                }
            });

            if(set.hasOwnProperty("activeGraph")){
                application.graphstate.restore(set.activeGraph);
            }

            // Keep the same listener if it is listed
            if(set.hasOwnProperty("listener")){
                set.listener = appstate.get("listener");
            }

            // Update the state
            appstate.set(set);

            times.push({
                name: "router.set time",
                time: timeNow() - st
            });

            var out = [];
            out.push("Time:\n");
            times.forEach(function(t){
                out.push(t.name + ": " + t.time + " ms");
            });
            console.log(out.join("\n"));
        }
    };
    
    /**
     * Load the site
     */
    pvt.loadSite = function(){
        var thisRouter = this;

        // Increment and output the number of times the page has tried to reload
        pvt.reloadcalls++;
        if(pvt.reloadcalls > 1){
            console.log("Reloads required: " + pvt.reloadcalls);
        }
        
        // Allocate variable for the site
        var site = null;
        
        // Preconfigure the hub
        return pvt.preconfigure(times).then(function(){
            
            // Build the site (All views)
            window.application = {
                cascadeplugin: null,
                contextmenu: null,
                mapviewsdata: null,
                mustache: {},
                programState: new ProgramState({
                    "id": "program-state"
                }),
                standardtablesubjects: [],
                svglib: SvgLib,
                svgs: {},
                telemetrystack: [],     // Stack for queing telemetry records before submission
                telemetrytimer: null,   // Timer for recording telemetry data
                views: {},
                multiselect: false,
                hovermanager: null
            };

            // Set up the appstate alias
            window.appstate = application.programState;

            // Set up the graph manager
            application.graphstate = new GraphState(appstate);

            // Set up the telemetry manager
            

            // Set up the data interface for backwards compatibility
            application.datainterface = buildDataInterface();

            // Link and start the hover manager
            application.hovermanager = HoverManager;
            application.hovermanager.start();

            // Add cascade plugin
            if(loadCascade){
                application.cascadeplugin = new CascadePlugin();
            }
            
            // Create a backbone model to hold site data
            var siteModel = new Backbone.Model({
                id: "site-model",
                locked: true,
                message: "ready to load"
            });

            // Build the central view for the site
            site = new Site({id: "site-view", model: siteModel});

            // Link the site to the application
            application.site = site;

            // Perform the initial site render
            site.render();

            // Lock the site to user input (Note: Temporary lock - no id provided to remove)
            site.lock(true);
            
            // Find the site area and display the rendered html
            $(".site-area").html(site.$el);

            // Check variables required for reload
            assertDefined(sset);
            assertType(userID, "number");
            
            // Relead the hub (causes event listeners to fire and requires sset and userID to be global)
            return pvt.reloadHub(times);
        }).then(function(){ 
            // Set up the edge graph
            var edgeGraphFactory = new EdgeGraphFactory();
            edgeGraphFactory.reset();
            
            var edges = Hub.get("edge");
            
            // Add edges
            edges.forEach(function(e){
                edgeGraphFactory.addEdges(e.get("startnode"), [e.get("endnode")]);
            });
            
            // Create
            SvgLib.setMasterGraph(edgeGraphFactory.create());
            
            // Toggle edge graph ready
            appstate.set("edgegraphready", true);
            appstate.set("edgegraphready", null);
            
            // Set up the print graph
            application.views.graphWindow.loadPrintGraph();
            
            // Get user
            var user = Hub.get("user").get(userID);
            
            // Set up the dashboard
            var dashboardDate = convertDbDate(user.get("dashboard_date"));
            var today = new Date();
            
            var years = today.getYear() - dashboardDate.year;
            var months = today.getMonth() - dashboardDate.month;
            var days = today.getDate() - dashboardDate.day;
            
            // If more than 2 days have passed then show the dashboard
            if(years > 0 || months > 0 || days > 2){
                appstate.set("dashboardOpen", true);
                user.set("dashboard_date", "now");
                return user.save({"wait": true});
            }else{
                return Promise.resolve();
            }
        }).then(function(){
            // Set up the site lock data structures
            locks = new JsClass.Set();
            lockNames = new JsClass.Hash();

            // Remove the initial lock
            site.lock(false);
            
            return Promise.resolve(site);
        }); 
    };

    /**
     * Preconfigure the hub.
     * @param {object} times - an object used to record load time.
     * @return {Promise}
     */
    pvt.preconfigure = function(times){
        var st = timeNow();
        if(isPackageLoaded("cascade-lib")){
            window.Cascade.preconfigure();
        }

        return Hub.preconfigure().then(function(){
            times.push({
                name: "hub.preconfigure",
                time: timeNow() - st
            });
            window.TIME_ZERO = Hub.TIME_ZERO;

            st = timeNow();
            return 
        }).then(function(){
            times.push({
                name: "cascade.preconfigure",
                time: timeNow() - st
            });
            return Promise.resolve();
        });
    };

    /**
     * Reload the hub. This will fill all hub collections with data from the server or local storage and will
     * trigger event listeners tied to those collections.
     * @param {object} times - an object used to record load time.
     */
    pvt.reloadHub = function(times){
        var st = timeNow();
        return Hub.reload().then(function(passed){
            if(!passed){
                throw Error("Failed to reload the hub.");
            }
            times.push({
                name: "hub.reload",
                time: timeNow() - st
            });
        });
    };
    
    approuter = new Router();
    hub = Hub;
    
    Backbone.history.start();
});


