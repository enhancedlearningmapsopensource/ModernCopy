function applyVelocityClassAnimation($el, mod, options){
    // Get original styles
    var elStyles = getCss($el);

    // Copy the element
    var $copy = $el.clone();
    $copy.prop("style", "");
    
    // Apply class changes
    mod($copy);
    
    // Prepend the copy
    $el.before($copy);

    // Get the copy styles
    var copyStyles = getCss($copy);

    // Remove the copy
    $copy.remove();            

    var diffStyles = Object.keys(elStyles).filter(function(cssProp){
        var elVal = elStyles[cssProp];
        if(copyStyles.hasOwnProperty(cssProp)){
            var copyVal = copyStyles[cssProp];
            if(elVal !== copyVal){
                return true;
            }else{
                return false;
            }
        }else{
            return true;
        }
    }).map(function(cssProp){
        return {
            prop: cssProp,
            orig: elStyles[cssProp],
            copy: copyStyles[cssProp]
        };
    });

    
    
    if(diffStyles.length > 0){
        var newStyles = diffStyles.reduce(function(acc, val){
            acc[val.prop] = val.copy;
            return acc;
        }, {});
        return $.Velocity.animate($el, newStyles, options).then(function(){
            mod($el);
        });
    }else{
        return Promise.resolve().then(function(){
            mod($el);
        });
    }
}

var velocityProps = ["font-size", "border-width"];
var getCss = function($el) {
    return velocityProps.reduce(function(acc, val){
        acc[val] = $el.css(val);
        return acc;
    }, {});
};

function linkJqueryToVelocity(){
    // Add class change function
    $.Velocity.animateAddClass = function($el, classes, options){
        classes = ($.isArray(classes)) ? classes : [classes];   
        return applyVelocityClassAnimation($el, function($copy){
            // Add the classes
            classes.forEach(function(cl){
                $copy.addClass(cl);
            });
        }, options);
    };

    // Remove class change function
    $.Velocity.animateRemoveClass = function($el, classes, options){
        classes = ($.isArray(classes)) ? classes : [classes];   
        return applyVelocityClassAnimation($el, function($copy){
            // Add the classes
            classes.forEach(function(cl){
                $copy.removeClass(cl);
            });
        }, options);
    };
}