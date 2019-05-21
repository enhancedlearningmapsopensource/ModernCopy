define([], function () {

    class ContextMenuFactory {
        /**
         * Use this function to create and initialize a context menu factory 
         * which is later passed when a context menu is required.
         *
         * example: 
         *      var menu = menuView.create('random','click');
         *      menu.addItem('Menu Option 1', function(){alert('Option 1 clicked');});
         *      menu.show();
         *
         * @param {string} menuName - the name of the context menu
         * @param {string} menuTrigger - the trigger of the menu (e.g. 'click','scroll','mouseover')
         * @param {Object} creatorContext - the context menu view that created this factory
         * @param {any} creator - the object that requested the view
         */
        constructor(menuName, menuTrigger, creatorContext, creator) {
            var thisClass = this;
            thisClass.objectType = menuName;
            thisClass.trigger = menuTrigger;
            thisClass.reactions = [];
            thisClass.creatorContext = creatorContext;
            thisClass.creator = creator;
        }

        /**
         * Add an item to the context menu
         *
         * @param {string} itemName - the name of the context menu item
         * @param {function} itemAction - actions that occur when the item is selected
         * @param {object} options - optional components. 
         * @param {boolean=false} options.circlesOn - turns on circles
         * @param {function} options.circleCallback - callback function for clicked circle
         * @return {object} - this factory for easy chaining.
         */
        addItem(itemName, itemAction, options) {
            var thisClass = this;
            var reaction = {};
            reaction.name = itemName.toUpperCase();
            reaction.callback = itemAction;
            reaction.options = options;
            reaction.condition = null;
            thisClass.reactions.push(reaction);
            return thisClass;
        }

        /**
         * Add an item to the context menu if a condition is met
         *
         * @param {string} itemName - the name of the context menu item
         * @param {function} itemAction - actions that occur when the item is selected
         * @param {function} condition - condition under which to add the item
         * @param {object} options - optional components. 
         * @param {boolean=false} options.circlesOn - turns on circles
         * @param {function} options.circleCallback - callback function for clicked circle
         * @return {object} - this factory for easy chaining.
         */
        addItemIf(itemName, itemAction, condition, options) {
            var thisClass = this;
            if (condition) {
                var reaction = {};
                reaction.name = itemName.toUpperCase();
                reaction.callback = itemAction;
                reaction.options = options;
                reaction.condition = condition;
                thisClass.reactions.push(reaction);
            }
            return thisClass;
        }

        /**
         * Create the context menu
         *
         * @return {object} - the context menu 
         */
        create() {
            var thisClass = this;

            var reactions = thisClass.reactions;
            
            return Promise.all(
            reactions.map(function(d){
                return Promise.resolve().then(function(){
                    if(d.condition !== null){
                        return d.condition;
                    }else{
                        return true;
                    }
                }).then(function(isTrue){
                    if(isTrue){
                        return {
                            name: d.name,
                            callback: d.callback,
                            options: d.options
                        }
                    }else{
                        return null;
                    }
                });
            })).then(function(results){
                return {
                    objectType: thisClass.objectType,
                    trigger: thisClass.objectType,
                    reactions: results.filter(function(d){return (d !== null);}),
                    creator: thisClass.creator
                }
            })

            
        }

        /**
         * Set the action to take if the context menu is not used.
         *
         * @param {function} action - the action to take. (default: null)
         */
        setDefaultAction(action) {
            this.defaultAction = action;
        }

        /**
         * Set the action to take when the context is lost.
         *
         * @param {function} action - the action to take. (default: null)
         */
        setReverseAction(action) {
            this.reverseAction = action;
        }

        /**
         * Show the context menu.
         *
         * @param {event} e - the javascript event that triggered the context menu.
         * @return {object} - this factory for easy chaining.
         */
        show(e) {
            var thisClass = this;
            thisClass.creatorContext.show(e, thisClass);
            return thisClass;
        }

        /**
         * Store this factory in the creator context menu.
         * @return {object} - this factory for easy chaining.
         */
        store(name){
            var thisClass = this;
            thisClass.creator.store(name, thisClass);
            return thisClass;
        }
    }

    return ContextMenuFactory;

})