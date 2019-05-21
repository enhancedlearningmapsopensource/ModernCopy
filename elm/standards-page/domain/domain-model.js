define(["backbone", "../cell/cell-collection"], 
function(Backbone, CellCollection){
             
    var pvt = {};         
    var Model = Backbone.Model.extend({
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisModel = this;
            thisModel.set({
                "cells": new CellCollection(),
                "selected": false
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