/* global application */

define(["core",
    "text!./template.html",
    "mustache", 
    "activeGraph",
    "constants", 
    "jsclass!3rdParty/jsclass/", 
    "hub-lib"],
function (Core, 
    Template,
    Mustache, 
    ActiveGraph, 
    Constants, 
    JsClass, 
    Hub) {

    var pvt = {};
    pvt.consts = {
        DOM_MUSTACHE: "#node-table-template",

    };
    pvt.consts.TEMPLATE_PATH = gRoot + "side-panel/sub-panels/node-table/template.html";

    var NodeTableView = Core.View.extend({
        template: Template,
        events: {
            "click .standard-link": "delegateClickStandard",
            "click .node-id-link": "delegateClickNode",
            "mouseover .node-row": "delegateMouseOverRow",
            "mouseleave .node-row": "delegateMouseLeaveRow",
            "click #print-node-table": "delegatePrint",
            "click #export-node-table": "delegateExport"
        },

        delegatePrint(e) {
            e.preventDefault();
            var thisView = this;
            var header = "";
                    
            var subgraph = ActiveGraph.getServerModel();
            var graphManager = application.graphstate;
            if(subgraph === null){
                header = graphManager.get().graphID;
            }else{
                header = subgraph.get("title");
            }
                    
            application.site.print(header + " Node Table", thisView.$el.find("table")[0].outerHTML.trim());
                    
            return Promise.resolve();
        },
                
        delegateExport: function(e){
            var thisView = this;
            e.preventDefault();
            var subgraph = ActiveGraph.getServerModel(appstate);
            var graphManager = application.graphstate;
            var header = "";
            if(subgraph === null){
                header = graphManager.get().graphID;
            }else{
                header = Hub.stripHtml(subgraph.get("title"));
            }
                                                
            var $rows = [];
            thisView.$el.find("table").find("tr").each(function(e){
                $rows.push($(this));
            });
                        
            var $titleRow = $rows.shift();
            var headers = [];
            $titleRow.find("th").each(function(e){
                headers.push($(this).html());
            });
                        
            var cells = $rows.map(function($d){
                var rowCells = [];
                $d.find("td").each(function(e){
                    var $link = $(this).find("a");
                    if($link.length === 0){
                        rowCells.push($(this).html());
                    }else{
                        var linkCells = [];
                        $link.each(function(l){
                            linkCells.push($(this).html());
                        });
                                    
                        if(linkCells.length > 1){
                            rowCells.push(linkCells.join(","));
                        }
                        rowCells = rowCells.concat(linkCells);
                    }
                });
                return rowCells;
            }).map(function(cellArray){
                return cellArray.map(function(cell){
                    return "\"" + cell + "\"";
                });
            });
                        
                        
                        

            var data = [["Map:", header],[]].concat([headers]).concat(cells);
            var csvContent = "data:text/csv;charset=utf-8,";
            data.forEach(function(infoArray, index){
                var dataString = infoArray.join(",");
                csvContent += index < data.length ? dataString+ "\n" : dataString;
            });
                        
                        

            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "node_table.csv");
            document.body.appendChild(link); // Required for FF
            link.click(); // This will download the data file named "my_data.csv"  
            document.body.removeChild(link);
                    
                    
        },

        /**
                 * Triggered when a user clicks on a standard in the table
                 * @param {event} e - the triggering event
                 * @listens {click .standard-link}
                 */
        delegateClickStandard: function (e) {
            var id = $(e.currentTarget).html().trim();
            appstate.set("standardClicked", id);
        },

        delegateClickNode: function (e) {
            e.preventDefault();
            var thisView = this;
            var id = Number($(e.currentTarget).attr("id"));
            appstate.get("selectedcircles").reset();
            appstate.get("selectedcircles").add({
                id: id
            });
            appstate.set({ selectededge: null });
        },

        delegateMouseLeaveRow: function (e) {
            unhighlightNodes();
        },

        delegateMouseOverRow: function (e) {
            var thisView = this;
            var $el = $(e.currentTarget);
            var $idCol = $el.find(".id-column").find("a");

            // Clear nodes
            thisView.delegateMouseLeaveRow();

            var id = $idCol.attr("id");
            id = Number(id);
            highlightNode(id);
            //var $circle = $("#node-" + id);
            //$circle.addClass("hovered");
        },
                
        delegateNodeLocated: function (model, options) {
            this.render();
        },

        delegateStandardLocated: function (model, options) {
            this.render();
        },

        initialize: function () {
            /**
                     * Setup DOM  
                     */
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            thisView.$el = $(thisView.el);
            thisView.model = new Backbone.Model({id: "node-table-model"});

            // Load the mustache template
            var template = thisView.$el.find(pvt.consts.DOM_MUSTACHE).html();
            Mustache.parse(template);
            thisView.model.set("template", template);

            thisView.listenTo(appstate, "change:sidePanel", thisView.render);
            thisView.listenTo(appstate, "change:activeGraph", thisView.render);
            //thisView.listenTo(thisView.model.get("graphs").get("activeGraph"), "change:nodes", thisView.render);
        },

        print: function () {
            var thisView = this;
            $("#print-div").html(thisView.$el.html());
        },

        render: function () {
            var thisView = this;

            var sidePanel = appstate.get("sidePanel");
            if (sidePanel !== null && sidePanel.localeCompare("Node Table") === 0) {
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
                var nodesKnown = Hub.getModels("node", nodeIDs);
                scope.nodesKnown = nodesKnown;

                var relatives = [];
                scope.standardsMissing = [];

                /// For any that we do, make sure we also have data on the children
                /// and parents. 
                if (nodesKnown.length > 0) {
                    for (var i = 0; i < nodesKnown.length; i++) {
                        var node = nodesKnown[i];
                        var nodeReady = true;

                        ["getChildrenIDs", "getParentIDs"].forEach(function (relative) {
                            Hub.wrap(node)[relative](application.datainterface).forEach(function (c) {
                                relatives.push(c);
                            });
                        });

                        Hub.wrap(node).getSIDs().forEach(function (c) {
                            scope.standardsMissing.push(c);
                        });
                    }
                }

                // Remove duplicates
                relatives.sort();
                for (var i = 0; i < relatives.length - 1; i++) {
                    if (relatives[i] === relatives[i + 1]) {
                        relatives.splice(i, 1);
                        i--;
                    }
                }
                            
                // Get relative models
                var relativesKnown = Hub.getModels("node", relatives);
                scope.relativesKnown = relativesKnown;

                var standardsKnown = Hub.getModels("simplestandard", scope.standardsMissing);
                var nodeList = new Backbone.Collection(scope.nodesKnown);
                nodeList.add(scope.relativesKnown);

                var visibleSetIDs = scope.nodesKnown.map(function (d) {
                    return d.id;
                });
                var visibleSet = new JsClass.Set(visibleSetIDs);

                if (scope.nodesKnown.length > 0) {
                    var standardList = new Backbone.Collection(standardsKnown);

                    // Remove duplicates
                    scope.nodesKnown.sort(function (a, b) {
                        return a.id - b.id;
                    });
                    for (var i = 0; i < scope.nodesKnown.length - 1; i++) {
                        if (scope.nodesKnown[i].id === scope.nodesKnown[i + 1].id) {
                            scope.nodesKnown.splice(i, 1);
                            i--;
                        }
                    }

                    var table = pvt.constructTable.call(thisView, visibleSet, nodeList, standardList, visibleSet);

                    // Render template 
                    var template = thisView.template;
                    if (template !== null) {
                        thisView.$el.addClass("open");
                        thisView.$el.html($(Mustache.render(template, table)));
                    }
                } else {
                    var activeSubject = appstate.get("activeSubject");
                    thisView.$el.html("<div class='container'><div class='row'><div class='col-xs-12'>No " + activeSubject + " nodes are associated with this graph</div></div></div>");
                }

            } else {
                thisView.$el.removeClass("open");
            }
        }
    });


    /**
             * Function constructs the table object needed by the template from a 
             * list of node objects. 
             * 
             * @param {Set<int>} visibleNodeIDs - the nodes to display
             * @param {Collection<IModel>} nodeList- the node server models
             * @param {Collection<IModel>} standardList - the standard server models
             * @return {object} - the object need to render the template
             */
    pvt.constructTable = function (visibleNodeIDs, nodeList, standardList) {
        var thisView = this;
        var table = {};

        table.nodetableheader = [
            {content: "Node ID"},
            {content: "Title"},
            {content: "Description"},
            {content: "Standards"},
            //{content: "Parents"},
            //{content: "Children"},
        ];
        table.noderowtemplate = [];

        visibleNodeIDs.forEach(function (n) {
            var sM = nodeList.get(n);

            var parents = [];
            var visibleParents = [];
            var children = [];
            var visibleChildren = [];
            var standards = [];

            /**
                     * Get the parent and children arrays
                     */
            ["getParentIDs", "getChildrenIDs"].forEach(function (relative) {
                Hub.wrap(sM)[relative]().forEach(function (p) {
                    if (!nodeList.has(p)) {
                        console.warn("a node is missing and shouldn't be!");
                    } else {
                        var q = nodeList.get(p);
                        var rel = {id: q.get("id"), title: q.get("textid")};

                        if (visibleNodeIDs.contains(rel.id)) {
                            switch (relative) {
                            case "getParentIDs":
                                visibleParents.push(rel);
                                break;
                            case "getChildrenIDs":
                                visibleChildren.push(rel);
                                break;
                            default:
                                throw Error("unknown relation: ") + relative;
                            }
                        } else {
                            switch (relative) {
                            case "getParentIDs":
                                parents.push(rel);
                                break;
                            case "getChildrenIDs":
                                children.push(rel);
                                break;
                            default:
                                throw Error("unknown relation: ") + relative;
                            }
                        }
                    }
                });
            });

            /*sM.get("childrenIds").forEach(function(p){
                     var q = nodeList.get(p);
                     children.push({id: q.get("id"), title: q.get("textid")});
                     });*/

            /** 
                     * Get the standard array
                     */
            Hub.wrap(sM).getSIDs().forEach(function (s) {
                if (!standardList.has(s)) {
                    console.warn("A standard is missing and shouldn't be");
                } else {
                    var p = standardList.get(s);
                    standards.push({id: p.id, title: Hub.wrap(p).textID()});
                }
            });

            var row = pvt.fabricateRow(
                sM.get("id"),
                Hub.stripHtml(sM.get("textid")),
                stripItags(sM.get("title")),
                stripItags(sM.get("shorttitle")),
                standards
            );
            table.noderowtemplate.push(row);
        });

        return {nodetabletemplate: [table]};
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
             * @param visibleParents {array<{id,title}>} - an array of visible parents
             * @param children {array({id:,title:})} - an array of objects containing children id and title 
             * @param visibleChildren {array<{id,title}>} - an array of visible children
             * @return {object} - object suitable for the render template
             */
    pvt.fabricateRow = function (id, textID, title, description, standards, parents, visibleParents, children, visibleChildren) {

        if (parents) {
            parents.forEach(function (p) {
                p.linkid = p.id;
                p.content = p.title;
                p.linkclass = "parent-link";
            });

            visibleParents.forEach(function (p) {
                p.linkid = p.id;
                p.content = p.title;
                p.linkclass = "parent-link";
            });
        }
        if (children) {
            children.forEach(function (c) {
                c.linkid = c.id;
                c.content = c.title;
                c.linkclass = "child-link";
            });
            visibleChildren.forEach(function (c) {
                c.linkid = c.id;
                c.content = c.title;
                c.linkclass = "child-link";
            });
        }
        standards.forEach(function (c) {
            c.linkid = c.id;
            c.content = c.title;
            c.linkclass = "standard-link";
        });



        return {
            /// Node ID Column
            idcolumntemplate: [{linkid: id, linkclass: "node-id-link", content: textID}],
            /// Title & Description Columns
            paragraphcolumntemplate: [{content: title}, {content: description}],
            listcolumntemplate: [
                {
                    linkitemtemplate: standards
                },
                /*{
                                 linkitemtemplate:visibleParents,
                                 itemtemplate:parents
                                 },
                                 {
                                 linkitemtemplate: visibleChildren,
                                 itemtemplate:children
                                 }*/
            ]
        };
    };



    return NodeTableView;
});