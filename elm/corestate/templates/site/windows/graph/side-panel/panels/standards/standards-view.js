define(["jquery",
        "core",
        "backbone",
        "text!./template.html", 
        "mustache", 
        "activeGraph", 
        "constants", 
        "hub-lib"],
function ($, 
          Core, 
          Backbone, 
          Template, 
          Mustache, 
          ActiveGraph, 
          Constants, 
          Hub) {
            
            var pvt = {};
            pvt.consts = {
                DOM_MUSTACHE: "#standards-template",
            };
            pvt.consts.TEMPLATE_PATH = gRoot + "side-panel/sub-panels/standards/template.html";

            var StandardsView = Core.View.extend({
                template: Template,
                events: {
                    "click .standard-link": "delegateClickStandard",
                    "mouseenter .standard-row": "delegateHover",
                    "mouseleave .standard-row": "delegateUnhover"
                },
                
                /**
                 * User clicks on a standard in the table
                 */
                delegateClickStandard: function (e) {
                    e.preventDefault();
                    var thisView = this;
                    var id = $(e.currentTarget).html().trim();
                    appstate.set("standardClicked", id);
                },

                /**
                 * User hovers over a standard row.
                 */
                delegateHover: function(e){
                    e.preventDefault();
                    var thisView = this;
                    var id = $(e.currentTarget).find(".standard-link").html().trim();
                    var standard = Hub.get("simplestandard").findWhere({textid: id});
                    var nodeIDs = Hub.wrap(standard).nodeIDs();
                    highlightNodes(nodeIDs);
                },
                
                /**
                 * User stops hovering over a standard row.
                 */
                delegateUnhover: function(e){
                    unhighlightNodes();
                },

                initialize: function () {
                    /**
                     * Setup DOM  
                     */
                    var thisView = this;
                    Core.View.prototype.initialize.call(thisView);
                    Mustache.parse(thisView.template);
                    
                    thisView.$el = $(thisView.el);
                    thisView.model = new Backbone.Model({id: 'standards-model'});
                    thisView.listenTo(appstate, "change:activeGraph", thisView.render);
                },

                render: function () {
                    var thisView = this;

                    var scope = {};
                    thisView.$el.addClass("open");

                    // Get the graph state
                    var graphState = application.graphstate;

                    // If there is no active graph then display a warning
                    if (graphState.isEmpty()) {
                        thisView.$el.html("<div class='container-fluid'>" + Constants.STRINGS.NO_ACTIVE_GRAPH_WARNING + "</div>");
                        return;
                    }

                    var nodeIDs = ActiveGraph.getNodes(appstate);
                    var nodeCollection = Hub.get("node");
                    scope.nodeIDs = nodeIDs;
                    var nodesKnown = nodeIDs.map(function (d) {
                        return nodeCollection.get(d);
                    });
                    
                    scope.nodeList = new Backbone.Collection(nodesKnown);
                    var standardsMissing = [];
                    if (nodesKnown.length > 0) {
                        for (var i = 0; i < nodesKnown.length; i++) {
                            var node = nodesKnown[i];

                            Hub.wrap(node).getSIDs().forEach(function (c) {
                                standardsMissing.push(c);
                            });
                        }
                    }
                    var standardsKnown = Hub.getModels("simplestandard", standardsMissing);
                                    
                                
                    var standardList = new Backbone.Collection(standardsKnown);
                    if (scope.nodeIDs.length > 0) {
                        var table = pvt.constructTable.call(thisView, scope.nodeIDs, scope.nodeList, standardList);
                        table.standards.sort(function (a, b) {
                            if (a.textid < b.textid) {
                                return -1;
                            }
                            if (a.textid > b.textid) {
                                return 1;
                            }
                            return 0;
                        });

                        // Render template 
                        var template = thisView.template;
                        if (template !== null) {
                            thisView.$el.html($(Mustache.render(thisView.template, table)));
                        }
                        
                        thisView.$el.find('[data-toggle="tooltip"]').each(function(e){
                            $(this).tooltip();
                        });
                        
                    } else {
                        var activeSubject = appstate.get("activeSubject");
                        thisView.$el.html("<div class='container'><div class='row'><div class='col-xs-12'>No " + activeSubject + " standards are associated with this graph</div></div></div>");
                    }
                }
            });
            //});


            /**
             * Function constructs the table object needed by the template from a 
             * list of node objects. 
             * 
             * @param nodeIDs {number[]} - ids of nodes in the current map
             * @param nodeList {Backbone.Model[]} nodeList - hub models for nodes in current map
             * @return {object} - the object need to render the template
             */
            pvt.constructTable = function (nodeIDs, nodeList, standardList) {
                var thisView = this;
                var table = {};

                var tableStandards = [];
                var standardIDs = [];

                /**
                 * Procecss each node to recover its standards
                 */
                nodeIDs.forEach(function (nid) {
                    /**
                     * Get the standards for this node 
                     */
                    console.assert(nodeList.has(nid));
                    var nodeStandards = Hub.wrap(nodeList.get(nid)).getSIDs();

                    /**
                     * Record standard ids 
                     */
                    nodeStandards.forEach(function (sid) {
                        var found = false;
                        for (var i = 0; i < standardIDs.length; i++) {
                            if (standardIDs[i] === sid) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            standardIDs.push(sid);
                        }
                    });
                });

                /**
                 * Procecss each standard id 
                 */
                standardIDs.forEach(function (sid) {
                    var standard = standardList.get(sid);
                    var standardNodes = Hub.wrap(standard).nodeIDs();

                    var nodesInMap = standardNodes.filter(function(d){
                        var match = nodeIDs.find(function(e){
                            return d === e;
                        });
                        return (typeof match !== "undefined");
                    });

                    if(typeof standard !== "undefined"){
                        tableStandards.push({
                            textid: Hub.stripHtml(standard.get("textid")), 
                            description: Hub.stripHtml(standard.get("description")),
                            nodecount: standardNodes.length,
                            nodeinmapcount: nodesInMap.length
                        });
                    }
                });
                return {standards: tableStandards};
            };

            /**
             * Function takes in details about a node and formats them to fit
             * within the node-table template. 
             * 
             * @param id {int} - the id of the node
             * @param textID {string} - the text id of the node
             * @param title {string} - the title of the node
             * @param standards {array({id:,title:})} - an array of objects containing standard id and title ({id:,title:})
             * @param parents {array({id:,title:})} - an array of objects containing parents id and title 
             * @param children {array({id:,title:})} - an array of objects containing children id and title 
             * @return {object} - object suitable for the render template
             */
            pvt.fabricateRow = function (id, textID, title, description, standards, parents, children) {

                parents.forEach(function (p) {
                    p.linkid = p.id;
                    p.content = p.title;
                    p.linkclass = 'parent-link';
                });
                children.forEach(function (c) {
                    c.linkid = c.id;
                    c.content = c.title;
                    c.linkclass = 'child-link';
                });
                standards.forEach(function (c) {
                    c.linkid = c.id;
                    c.content = c.title;
                    c.linkclass = 'standard-link';
                });

                return {
                    /// Node ID Column
                    idcolumntemplate: [{linkid: id, linkclass: 'node-id-link', content: textID}],
                    /// Title & Description Columns
                    paragraphcolumntemplate: [{content: title}, {content: description}],
                    listcolumntemplate: [
                        {
                            linkitemtemplate: standards,
                        },
                        {
                            linkitemtemplate: parents,
                        },
                        {
                            linkitemtemplate: children, /*[
                             {
                             linkid: 'child-id',
                             linkclass: 'child-link',
                             content: 'child1',
                             },
                             ],
                             itemtemplate:[
                             {content: 'parents2'}
                             ]*/
                        }
                    ]
                };
            };


            return StandardsView;
        });