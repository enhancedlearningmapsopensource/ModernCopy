define(["backbone",
        "../subject-tab/subject-tab-collection",
        "../map-section/map-section-model",
        "../node-row/node-row-model"], 
function(Backbone,
         SubjectTabCollection,
         MapSectionModel,
         NodeRowModel){
             
    var pvt = {};         
    var Model = Backbone.Model.extend({
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisModel = this;
            thisModel.set({
                "modeltype": "omnisearch",
                "result": null,
                "showall": false,
                "subjects": new SubjectTabCollection(),
                "resourcesection": new MapSectionModel({
                    "id": "resource-section-model",
                    "title": "Matching Map Views & Resources",
                    "res": true
                }),
                "nonresourcesection": new MapSectionModel({
                    "id": "non-resource-section-model",
                    "title": "Matching Map Views",
                    "res": false
                }),
                "keywordand": new NodeRowModel({
                    "id": "keyword-and-node-row",
                    "title": "Search nodes using keywords",
                    "match": "match any (and)",
                    "icon": gRoot + "/assets/img/searchdirect.svg",
                    "operation": "keyword"
                }),
                "keywordor": new NodeRowModel({
                    "id": "keyword-or-node-row",
                    "title": "Search nodes using keywords",
                    "match": "match any (or)",
                    "icon": gRoot + "/assets/img/searchdirect.svg",
                    "operation": "keyword"
                }),
                "includeand": new NodeRowModel({
                    "id": "include-and-node-row",
                    "title": "Search for more nodes to include",
                    "match": "match any (and)",
                    "icon": gRoot + "/assets/img/searchquick.svg",
                    "operation": "include"
                }),
                "includeor": new NodeRowModel({
                    "id": "include-and-node-row",
                    "title": "Search for more nodes to include",
                    "match": "match any (or)",
                    "icon": gRoot + "/assets/img/searchquick.svg",
                    "operation": "include"
                })
            });
        },
        
        /**
         * Render the view
         */
        parse:function(data){
            var thisModel = this;
        }
    });
    return Model;
});