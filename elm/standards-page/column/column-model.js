define(["backbone", "../cell/cell-collection", "hub-lib"], 
function(Backbone, CellCollection, Hub){
             
    var pvt = {};         
    var Model = Backbone.Model.extend({
        
        addCell: function(cell){
            var thisModel = this;
            
            
            
            var columnOrd = thisModel.get("columnindex");
            
            
//            var cellDomain = cell.get("hubmodel").get("domaingroupid");
//            var cellOrd = cell.get("hubmodel").get("ord");
//            
//            // Find domain group offset
//            var domainGroup = Hub.get("domaingroup").get(cellDomain);
//            var domainOrd = domainGroup.get("ord");
//            
//            // Find all domain groups in the row
//            var domainGroups = Hub.get("domaingroup").where({roword: domainGroup.get("roword")}, false, Hub);
//            
//            // Sort by ord
//            domainGroups.sort(function(a,b){
//                return a.get("ord") - b.get("ord");
//            });
//            
//            if(domainGroup.get("ord") > 0){
//                var k = 0;
//            }
//            
//            // Cell Index
//            var cellIndex = 0;
//            for(var i = 0; i < domainGroups.length; i++){
//                if(domainGroups[i].id === cellDomain){
//                    cellIndex += cellOrd;
//                    break;
//                }else{
//                    // Get all cells in the domaingroup
//                    var groupCells = Hub.get("cell").where({domaingroupid: domainGroups[i].id}, false, Hub);
//                    cellIndex += groupCells.length;
//                }
//            }
            var cellIndex = Hub.wrap(cell.get("hubmodel")).columnIndex();
            if(cellIndex === columnOrd){
                thisModel.get("cells").add(cell);
            }
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisModel = this;
            thisModel.set({
                "cells": new CellCollection(),
                "selected": false
            });
            
            // Get all columns in this subject
            var columns = Hub.get("standardcolumn").where({subjectid: thisModel.get("hubmodel").get("subjectid")}, false, Hub);
            
            // Sort by ord
            columns.sort(function(a,b){
               return (a.get("ord") - b.get("ord")); 
            });
            
            for(var i = 0; i < columns.length; i++){
                if(columns[i].id === thisModel.get("hubmodel").id){
                    thisModel.set("columnindex", i);
                }
            }
            
            var minOrd = columns[0].get("ord");
            
            
            var ix = thisModel.get("columnindex");
                
            
                
            var k = 0;
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