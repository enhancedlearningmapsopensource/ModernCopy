define(["backbone",
        "./program-state-listener"], 
function(Backbone,
         Listener){
    return Backbone.Model.extend({
        defaults: function () {
            return {
                activeGraphTransform: "center",
                activeSet: null,
                activeSubject: null,
                activeWindow: "standard",
                cascadeopen: false,
                edgegraphready: null,
                hidenonresmaps: false,
                hidenonelmmaps: false,
                listener: null,
                maptablefilter: "",
                sidePanel: null,
                sidepanelopen: false,
                selectedcircles: new Backbone.Collection(),
                selectededge: null,
                selectedstandardcells: "{}",
                standardcellsselected: "",
                standardTableCellsSelectedDetailed: [],
                standardselected: null,
                showallresources: false,
                showdeletedmaps: false,
                targettedcircles: new Backbone.Collection(),
                userID: userID
            };
        },

        initialize: function(){
            var thisModel = this;
            thisModel.set("listener", new Listener({id: "program-state-listener", appstate: thisModel}));
        },
        
        toUrl: function(){
            var thisModel = this;
            var listener = thisModel.get("listener");
            if(listener.hasOwnProperty("id") && listener.id === "program-state-listener"){
                return listener.toUrl();
            }
            return null;
        }
    });
    
});
