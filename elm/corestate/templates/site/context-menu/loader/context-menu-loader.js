define([""], 
function() {
		 	
	var ContextMenuLoader = {};
	ContextMenuLoader.load = function(contextMenu){
		ContextMenuLoader.loadCircle(contextMenu);
	};
	
	ContextMenuLoader.loadCircle = function(contextMenu){
		var clickOptions = {contextMenu: contextMenu, objectType: "CIRCLE", trigger: "CLICK"};
		var hoverOptions = {contextMenu: contextMenu, objectType: "CIRCLE", trigger: "HOVER"};
		
		/// Load Menu Items For Context Menu if its enabled
		ContextMenuLoader.addMenuItem("SELECT", "circle-selected", clickOptions);
		ContextMenuLoader.addMenuItem("FOCUS", "circle-highlight", clickOptions);
		
		ContextMenuLoader.addDefaultItem("circle-selected", clickOptions);
		ContextMenuLoader.addDefaultItem("circle-highlight", hoverOptions);
		//contextMenu.addContextMenuItem(objectType, "SELECT", function(e){ContextMenuLoader.fireEvent(e, "circle-selected");});
		
	};
	
	ContextMenuLoader.addMenuItem = function(menuName, eventName, options){
		var contextMenu 	= options.contextMenu;
		var objectType 		= options.objectType;
		var trigger 		= options.trigger;
		contextMenu.addContextMenuItem(objectType, menuName, trigger, function(e){ContextMenuLoader.fireEvent(e, eventName);});
	};
	
	ContextMenuLoader.addDefaultItem = function(eventName, options){
		var contextMenu 	= options.contextMenu;
		var objectType 		= options.objectType;
		var trigger 		= options.trigger;
		contextMenu.addDefaultItem(objectType, trigger, function(e){ContextMenuLoader.fireEvent(e, eventName);});
	};
	
	ContextMenuLoader.fireEvent = function(e, eventType){
		$(e.currentTarget).trigger(eventType, e);//.hide();//[0].dispatchEvent(new CustomEvent('circle-selected', { 'detail': e }));
	};
  	
	return ContextMenuLoader;
});