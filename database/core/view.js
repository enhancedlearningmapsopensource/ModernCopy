define(["backbone", "./child-view-list"], function(Backbone, ChildViewList){
    var pvt = {};         
    var View = Backbone.View.extend({
        /**
         * Add child view
         * @param {type} view - view
         * @param {type} name - name of view (optional)
         * @return {Core.View}
         */
        add: function(view, name){
            var thisView = this;
            
            // Swap order
            if(typeof view === "string" && typeof name === "object"){
                return thisView.add(name, view);
            }
            
            thisView.children.add(view, {
                name: name
            });
            view.parents.push({group: "main", parent: thisView});
            return view;
        },
        
        /**
         * Add to group
         * @param {type} group - name of group
         * @param {type} view - view
         * @param {type} name - name of view (optional)
         * @return {Core.View}
         */
        addToGroup: function(group, view, name){
            var thisView = this;
            thisView.children.add(view, {
                group: group,
                name: name
            });
            view.parents.push({group: group, parent: thisView});
            return view;
        },
        
        /**
         * Close the view and remove all events and DOM elements
         */
        close: function(){
            var thisView = this;
            
            // Close any children
            thisView.children.close();
            
            // Copy the window.coreviews
            var copy = {};
            Object.keys(window.coreviews.views).forEach(function(key){
                if(Number(key) !== thisView.coreid){
                    copy[key] = window.coreviews.views[key];
                }
            });
            window.coreviews.views = copy;
            
             // COMPLETELY UNBIND THE VIEW
            thisView.undelegateEvents();

            thisView.$el.removeData().unbind(); 

            // Remove view from DOM
            thisView.remove();  
            Backbone.View.prototype.remove.call(thisView);
        },
        
        /**
         * Detach all child views in the given group.
         * @param {string} group - the group
         * @return {Backbone.Core.View[]} - the rendered views
         */
        detachGroup: function(group){
            var thisView = this;
            var views = thisView.children.getGroup(group);
            views.forEach(function(d){
                d.$el.detach();
            });
            return views;
        },
		
		/**
         * Apply the given function to every element in a specific group.
         * @param {function} f - function ({view} -> {number} -> {undefined})
         * @param {string} group - the group name (default=main)
         */
        forEachInGroup: function(group, f){
            var thisView = this;
            thisView.children.forEachInGroup(group, f);
        },
        
        /**
         * Checks to see if the list contains the given view.
         * @param {string} group - the group name (if applicable)
         * @param {string} name - the view name. If the view is not in a group then leave this empty and put the name in the group field.
         * @return {boolean} - true if the view exists in the list, otherwise false
         * 
         * Use Cases:
         * has("group name", "view name")
         * has("view name")
         */
        has: function(group, name){
            var thisView = this;
            return thisView.children.has(group, name);
        },

        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            if(!window.hasOwnProperty("coreviews")){
                window.coreviews = {
                    cnt: 0,
                    views: {}
                };
            }
            thisView.coreid = window.coreviews.cnt++;
            thisView.parents = [];
            if(thisView.coreid === 51){
                var k = 0;
            }
            window.coreviews.views[thisView.coreid] = thisView;
            thisView.children = new ChildViewList();
        },
        
        get: function(group, name){
            var thisView = this;
            return thisView.children.get(group,name);
        },
        
        /**
         * Get a list of the views that close when this one does
         * @return {Core.View[]} - views that close when this one does
         */
        queryClose: function(){
            var thisView = this;
            var closed = thisView.children.queryClose().reduce(function(acc,val){
                return acc.concat(val);
            }, []);
            return closed.concat(thisView);
        }
    });
    
    View.extend = function (child) {
        var ex = Backbone.View.extend.apply(this, arguments);
        ex.prototype.events = _.extend({}, this.prototype.events, child.events);
        return ex;
    };
    
    return View;
});
