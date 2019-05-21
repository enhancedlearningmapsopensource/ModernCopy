/* global userID */

define(["core",
    "text!./template.html",
    "mustache",
    "activeGraph",
    "constants",
    "jsclass!3rdParty/jsclass/",
    "corestate/_misc/svg-to-png-converter",
    "../../utility/map-saver/map-saver",
    "hub-lib"],
        function (Core,
                Template,
                Mustache,
                ActiveGraph,
                Constants,
                JsClass,
                SvgToPngConverter,
                MapSaver,
                Hub) {

            var pvt = {};
            pvt.consts = {
                DOM_MUSTACHE: "#map-view-info-template",
                PRIMARY_SVG: ".graph-window > #graph-wrapper"
            };
            pvt.consts.TEMPLATE_PATH = gRoot + "side-panel/sub-panels/map-view-info/template.html";
            pvt.consts.AJAX = {};
            pvt.consts.AJAX.UPLOAD_SVG = gRoot + "side-panel/sub-panels/map-view-info/ajax/ajax-upload-svg.php";
            pvt.consts.PRINT_SETTINGS = {
                CIRCLE: {
                    STROKE_WIDTH: {
                        GRAY: 3,
                        BLUE: 3,
                        RED: 10
                    },
                    STROKE: {
                        GRAY: "rgba(128, 128, 128, 0.72)",
                        BLUE: "#0a0ac6",
                        RED: "red"
                    }
                }
            }


            var MapViewInfoView = Core.View.extend({
                template: Template,
                events: {
                    "click #map-view-print": "delegatePrintMap",
                    "click #map-view-print-visible": "delegatePrintVisibleMap",
                    "click #map-view-png": "delegateDownloadMapPng",
                    "click #map-view-png-visible": "delegateDownloadVisibleMapPng"
                },

                /**
                 * @listens click:#savebutton
                 */
                delegateSaveChanges: function (e) {
                    e.preventDefault();

                    var thisView = this;
                    
                    appstate.set("mapbeingsaved", )

                    // Swap to map views menu
                    thisView.model.set("sidePanel", "My Map Views");

                    // Trigger a save
                    thisView.model.get("views").sidePanelMapViews.saveChangesToCurrent();

                },

                delegatePrintMap: function () {
                    $("#print-div svg").replaceWith($(pvt.consts.PRIMARY_SVG).html());
                    $("#print-div svg g:first")[0].setAttribute("transform", "scale(1 1)");
                    
                    // Set circle styles
                    $("#print-div svg circle").each(function(e){
                        var color = $(this).attr("stroke").toUpperCase();
                        $(this)[0].setAttribute("stroke-width", pvt.consts.PRINT_SETTINGS.CIRCLE.STROKE_WIDTH[color]);
                        $(this)[0].setAttribute("stroke", pvt.consts.PRINT_SETTINGS.CIRCLE.STROKE[color]);
                        if(color == "GRAY"){
                            $(this)[0].setAttribute("stroke-dasharray", "5,5");
                        }
                    });
                    
                    application.views.graphWindow.print();
                },
                
                delegatePrintVisibleMap: function(){
                    var $graph = $(pvt.consts.PRIMARY_SVG + " > svg");
                    $("#print-div svg").replaceWith($graph.clone());
                    
                    // Set circle styles
                    $("#print-div svg circle").each(function(e){
                        var color = $(this).attr("stroke").toUpperCase();
                        $(this)[0].setAttribute("stroke-width", pvt.consts.PRINT_SETTINGS.CIRCLE.STROKE_WIDTH[color]);
                        $(this)[0].setAttribute("stroke", pvt.consts.PRINT_SETTINGS.CIRCLE.STROKE[color]);
                        if(color == "GRAY"){
                            $(this)[0].setAttribute("stroke-dasharray", "5,5");
                        }
                    });                    
                    
                    application.views.graphWindow.print();
                },
                
                delegateDownloadMapPng: function(e){
                    var $svgDiv = $(pvt.consts.PRIMARY_SVG);
                    SvgToPngConverter.SvgToPng($svgDiv[0], true);
                },
                
                delegateDownloadVisibleMapPng: function(e){
                    var $svgDiv = $(pvt.consts.PRIMARY_SVG);
                    SvgToPngConverter.SvgToPng($svgDiv[0], false);
                },

                initialize: function () {
                    var thisView = this;
                    Core.View.prototype.initialize.call(thisView);
                    Mustache.parse(thisView.template);
                    
                    thisView.add("saver", new MapSaver({
                        id: "map-saver-view"
                    })).render();

                    thisView.model = new Backbone.Model({id: 'map-view-info-model'});
                    thisView.listenTo(appstate, "change:activeGraph", thisView.render);
                },

                render: function () {
                    var thisView = this;
                    var renderOb = {
                        mapopen: false,
                        title: null,
                        description: null
                    };                    
                    
                    // Get the graph state
                    var graphManager = application.graphstate;
                    if (!graphManager.isEmpty()) {
                        // Get the active graph
                        var activeGraph = ActiveGraph.getServerModel();
                        if(activeGraph !== null && typeof activeGraph !== "undefined"){
                            renderOb.mapopen = true;
                            renderOb.title = Hub.stripHtml(activeGraph.get("title"));
                            renderOb.description = Hub.stripHtml(activeGraph.get("description"));
                            renderOb.clean = ActiveGraph.isClean();
                            renderOb.ownedmap = (activeGraph.get("creatorid") === userID);
                        }
                    }
                    
                    // Detach
                    thisView.get("saver").$el.detach();
                    
                    var $el = $(Mustache.render(thisView.template, renderOb));
                    thisView.$el.after($el);
                    thisView.$el.remove();
                    thisView.setElement($el[0]);
                    
                    // Reattach
                    thisView.$el.find(".map-saver-area").replaceWith(thisView.get("saver").$el);
                }
            });

            return MapViewInfoView;
        });