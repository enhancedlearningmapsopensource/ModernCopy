define([], function(){
    /**
     * Augments a blank object to use as a timer.
     * @param {type} timing - a blank object reference
     */
    return function(timing){
        timing.subs = {};
        timing.start = function(name){
            if(timing.hasOwnProperty(name)){
                throw Error("Name already in use.");
            }else{
                timing[name] = timeNow();
            }
        };
        timing.stop = function(name){
            if(!timing.hasOwnProperty(name)){
                throw Error("Name not recognized: " + name);
            }else{
                timing[name] = timeNow() - timing[name];
            }
        };
        timing.startsub = function(name){
            timing.subs[name] = timeNow();
            if(!timing.hasOwnProperty(name)){
                timing[name] = 0;
            }
        };
        timing.stopsub = function(name){
            if(!timing.subs.hasOwnProperty(name)){
                throw Error("Sub name not recognized: " + name);
            }
            timing[name] = Number(timing[name]) + Number(timeNow() - timing.subs[name]);
        };
        timing.print = function(){
            var thisTimer = this;
            return Object.keys(thisTimer).filter(function(d){
                return (typeof thisTimer[d] !== "function");
            }).map(function(d){
                return d + ": " + timing[d];
            }).join("\n");
        };
    };
});

