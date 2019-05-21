/* global pvt */

define([], function(){
    var pvt = {};
    class ChildViewList{
        constructor(){
            var thisClass = this;
            thisClass._sublist = {
                main: {}
            };
        }
        
        /**
         * Add a new child view
         * @param {object} options
         * @param {Core.View} child - the new child view
         * @param {string} options.name - name of the child
         * @param {string} options.group - group of the child
         * @return {Core.View} - the newly added view
         */
        add(child, options){
            var thisClass = this;
            if(!child.hasOwnProperty("coreid")){
                throw Error("Not a core view.");
            }
            options = (typeof options === "undefined" || options === null) ? {} : options;
            var name = (options.hasOwnProperty("name") && typeof options.name !== "undefined") ? options.name : child.coreid;
            var group = (options.hasOwnProperty("group")) ? options.group : "main";
            
            pvt.addToSublist.call(thisClass, child, name, group);
            return child;
        }
        
        /**
         * Close all child views and remove them from the list.
         */
        close(){
            var thisClass = this;
            thisClass.forEach(function(d){
                d.close();
            });
            thisClass._sublist = {
                main: {}
            };
        }
        
        /**
         * Apply the given function to every element.
         * @param {function} f - function ({view} -> {number} -> {undefined})
         */
        forEach(f){
            var thisClass = this;
            var i = 0;
            Object.keys(thisClass._sublist).forEach(function(group){
                pvt.forEachInGroup.call(thisClass, f, group, i);
            });
        }
        
        /**
         * Apply the given function to every element in a specific group.
         * @param {function} f - function ({view} -> {number} -> {undefined})
         * @param {string} group - the group name (default=main)
         */
        forEachInGroup(group, f){
            var thisClass = this;
            var i = 0;
            if(typeof f === "undefined" && typeof group === "function"){
                f = group;
                group = "main";
            }
            pvt.forEachInGroup.call(thisClass, f, group, i);
        }
        
        /**
         * Get a view
         * @param {string} group - the name of the group or the name of the view if there is no group
         * @param {string} name - the name of the view. If no group then put name in the group parameter and leave this empty.
         * @return {Core.View}
         */
        get(group, name){
            var thisClass = this;
            if(typeof name === "undefined" || name === null){
                name = group;
                group = "main";
            }
            return thisClass._sublist[group][name];
        }
        
        /**
         * Get a group of views
         * @param {string} group - the name of the group.
         * @return {Core.View[]} - the views in the group
         */
        getGroup(group){
            var thisClass = this;
            var views = thisClass._sublist[group];
            if(typeof views === "undefined"){
                return [];
            }else{
                return Object.keys(views).reduce(function(acc, val){
                    return acc.concat(views[val]);
                }, []);
            }
        }
        
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
        has(group, name){
            var thisClass = this;
            if(typeof name === "undefined"){
                name = group;
                group = "main";
            }
            
            if(!thisClass._sublist.hasOwnProperty(group)){
                return false;
            }
            var viewGroup = thisClass._sublist[group];
            if(!viewGroup.hasOwnProperty(name)){
                return false;
            }
            return true;
        }
        
        /**
         * Apply the given function to every element.
         * @param {function} f - function ({view} -> {number} -> {any})
         * @return {any[]}
         */
        map(f){
            var thisClass = this;
            var i = 0;
            return Object.keys(thisClass._sublist).reduce(function(acc, group){
                return acc.concat(pvt.mapGroup.call(thisClass, f, group, i));
            }, []);
        }
        
        /**
         * Get a list of the views that close when this list does
         * @return {Core.View[]} - views that close when this list does
         */
        queryClose(){
            var thisClass = this;
            var closed = thisClass.map(function(d){
                return d.queryClose();
            });
            
            return closed.reduce(function(acc,val){
                return acc.concat(val);
            }, []);
        }
        
        /**
         * Removes but does not close the view. See (remove) for more information.
         * @param {string} group - the group name (if applicable)
         * @param {string} name - the view name. If the view is not in a group then leave this empty and put the name in the group field.
         * @return {Core.View} - the removed view
         */
        removeNoClose(group, name){
            var thisClass = this;
            if(typeof name === "undefined"){
                name = group;
                group = "main";
            }
            
            // When using numbers to compare to keys they need to be strings
            if($.isNumeric(name)){
                name = name.toString();
            }
            
            if(!thisClass._sublist.hasOwnProperty(group)){
                throw Error("No group with name '"+group+"' found.");
            }
            var viewGroup = thisClass._sublist[group];
            if(!viewGroup.hasOwnProperty(name)){
                throw Error("A view by this name ("+name+") does not exist in the '"+group+"' group.");
            }
            
            var toRemove = viewGroup[name];
            var copy = {};
            Object.keys(viewGroup).forEach(function(key){
                if(key !== name){
                    copy[key] = viewGroup[key];
                }
            });
            
            thisClass._sublist[group] = copy;
            return toRemove;
        }
        
        /**
         * Remove and closes the child with the given name from the list.
         * @param {string} group - the group name (if applicable)
         * @param {string} name - the view name. If the view is not in a group then leave this empty and put the name in the group field.
         * @return {Core.View} - the removed view
         * 
         * Use Cases:
         * remove("group name", "view name")
         * remove("view name")
         */
        remove(group, name){
            var thisClass = this;
            var toRemove = thisClass.removeNoClose(group,name);
            toRemove.parents.forEach(function(parentRecord){
                var parent = parentRecord.parent;
                var childGroup = parentRecord.group;
                if(parent.has(childGroup, toRemove.name)){
                    parent.removeNoClose(childGroup, toRemove.name);
                }
            });
            
            toRemove.close();
            return toRemove;
        }
    }
    
    pvt.addToSublist = function(child, name, group){
        var thisClass = this;
        if(!thisClass._sublist.hasOwnProperty(group)){
            thisClass._sublist[group] = {};
        }
        if(thisClass._sublist[group].hasOwnProperty(name)){
            throw Error("A view by this name ("+name+") already exists in the '"+group+"' group.");
        }
        thisClass._sublist[group][name] = child;
    };
    
    pvt.forEachInGroup = function(f,group,i){
        var thisClass = this;
        var v = thisClass._sublist[group];
        if(typeof v !== "undefined"){
            Object.keys(v).forEach(function(child){
                f(v[child], i);
                i++;
            });
        }
    };
    
    pvt.mapGroup = function(f,group,i){
        var thisClass = this;
        var v = thisClass._sublist[group];
        return Object.keys(v).map(function(child){
            return f(v[child], i++);
        });
    };
    
    return ChildViewList;
});

