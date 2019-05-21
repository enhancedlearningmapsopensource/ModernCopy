define(["backbone", "../row/row-collection", "../column/column-collection", "../cell/cell-collection"], 
function(Backbone, RowCollection, ColumnCollection, CellCollection){
             
    var pvt = {};         
    var Model = Backbone.Model.extend({
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisModel = this;
            
            assert(thisModel.has("subject"));
            thisModel.set({
                "rows": new RowCollection(),            // Container for Row models
                "columns": new ColumnCollection(),      // Container for Column models
                "cells": new CellCollection()
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