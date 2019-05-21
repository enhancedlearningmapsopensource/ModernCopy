//console.log("...ContextMenuModel Module loading");
define(["backbone", "jsclass!3rdParty/jsclass/"], 
function(Backbone, JsClass) {
		 	
	var pvt = {};
  	pvt.consts = {};
    
    var ContextMenuModel = Backbone.Model.extend({
    	defaults: function () {
      		return {
        		x: 0,
        		y: 0,
        		contextResponses: [],
        		context: "",
        		contextEvent: null,
        		hoverTarget: null,
        		trigger: "",
        		useContextMenu: true,
        		reverse: null,
        		storage: new JsClass.Hash(),
        		treatHoverAsClick: true,
        		visible: false,
      		};
    	},
    });
    
    //console.log("ContextMenuModel Module loaded...");
	return ContextMenuModel;
});