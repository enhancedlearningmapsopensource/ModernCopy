
/* global application, hub, appstate */


/**
 * @param {bool} condition 
 * @param {string=} msg
 */
function assert(condition, msg){
    
    var msg = "assertion failed" + ((msg) ? ": " + msg : "");
    // Condition is invalid
    /*if(typeof condition === 'undefined' || condition === null){
        throw Error(msg);
    }*/
    assertDefined(condition, msg);
    //assertType(condition, "boolean");
    
    // Condition is valid but false
    if(!condition){
        console.warn(msg);
        throw Error(msg);
    }
}

/**
 * @param {Object} ob 
 * @param {string=} msg
 */
function assertDefined(ob, msg){
    var msg = "assertion failed" + ((msg) ? ": " + msg : "");
    // Condition is invalid
    if($.isArray(ob)){
        ob.forEach(function(o){
            assertDefined(o, msg);
        });
    }else if(typeof ob === 'undefined'){
        console.warn(msg);
        throw Error(msg);
    }else{
        return ob;
    }
}

/**
 * Check if the given object is null or not defined. If either then throw an error.
 * @param {Object} ob 
 * @param {string=} msg
 */
function assertExists(ob, msg){
    var msg = "assertion failed" + ((msg) ? ": " + msg : "");
    // Condition is invalid
    if(typeof ob === 'undefined' || ob === null){
        console.warn(msg);
        throw Error(msg);
    }else{
        return ob;
    }
}


function assertEqual(a, b){
    assertDefined(a);
    assertDefined(b);
    
    var typeofa = typeof a; 
    var typeofb = typeof b;
    assert(typeofa == typeofb, "Expected: '"+typeofa+"', Actual: '"+typeofb+"'");
    assert(a == b, "Expected: '"+a+"', Actual: '"+b+"'");
}

/**
 * 
 * @typedef {any} ObType
 * 
 * Ensure an object is of the given type
 * @param {ObType} ob - the object to check
 * @param {type} type - the expected type
 * @returns {ObType} - the object provided in the ob param
 */
function assertType(ob, type){
    if(ob === null){
         assert(false, "assertion failed: invalid type. Expected: '" + type + "', Actual: 'null'");
    }
    
    assert((typeof type === 'string'), "cannot evaluate type: " + type);
    var typeOfOb = typeof ob;
    type = type.trim();
    type = (type == "Object") ? "object" : type;
    if(typeOfOb !== type){
        
        // Type is an array so evaluate separately
        if(type.split("[]").length > 1){
            assert($.isArray(ob), "assertion failed: invalid type. Expected: '" + type + "', Actual: '" + typeOfOb + "'");
            ob.forEach(function(d){
                assertType(d, type.split("[]")[0]);
            });
        }else if(typeOfOb == 'object'){
            if(!ob.hasOwnProperty("_enforcedType") || ob._enforcedType != type){
                // Type is not an array so throw error
                var msg = "assertion failed: invalid type. Expected: '" + type + "', Actual: '" + typeOfOb + "'";
                console.warn(msg);
                throw Error(msg);
            }
        }else{
            // Type is not an array so throw error
            var msg = "assertion failed: invalid type. Expected: '" + type + "', Actual: '" + typeOfOb + "'";
            console.warn(msg);
            throw Error(msg);
        }
              
    }else if(type === 'number' && isNaN(ob)){
        var msg = "assertion failed: invalid type. Expected: '" + type + "', Actual: 'NaN'" ;
        console.warn(msg);
        throw Error(msg);
    }
    return ob;
}

/**
 * Sort and remove duplicates from list
 * @param {array} lst - list of items to clean
 * @param {function} attrFunc - function to determine the sort value
 * 
 * e.g. 
 * var lst = [{n: a, id: 2}, {n: b, id: 4}];
 * var attrFunc = function(d){
 *      return d.id;    // <-- will be sorted by the id of the object
 * }
 */
function removeDuplicates(lst, attrFunc){
    if(!$.isArray(lst)){
        throw Error("list is not an array");
    }
    attrFunc = (!attrFunc) ? (function(d){return d;}) : attrFunc;

    lst.sort(function(a, b){
        var aAttr = attrFunc(a);
        var bAttr = attrFunc(b);
        return aAttr - bAttr;
    });
    for(var i = 0; i < lst.length - 1; i++){
        if(attrFunc(lst[i]) == attrFunc(lst[i + 1])){
            lst.splice(i,1);
            i--;
        }
    }
}

/**
 * Stripst the [i] tags from the text
 * @param {string} txt - text to strip
 * @return {string} - cleaned text
 */
function stripItags(txt){
    return txt.replaceAll("[i]", "<em>").replaceAll("[/i]", "</em>");
}


/**
 * Turn a list of promises into a single promise sequence that runs one promise after another. 
 * @param {Promise[]} promiseLst
 * @return {Promise} - the sequenced promise list
 */
function sequencePromises(promiseLst) {
    if (!$.isArray(promiseLst)) {
        throw Error("input must be an array.");
    }

    promiseLst.forEach(function (d) {
        if (typeof d !== "function") {
            throw Error("Promise list should contain functions that produce promises. Contains: " + (typeof d));
        }
    });

    var sequence = Promise.resolve();
    promiseLst.forEach(function (p) {
        sequence = sequence.then(p);
    });
    return sequence;
}

// modified version of https://codepen.io/gapcode/pen/vEJNZN
// Copyright (c) 2016 by Mario
// MIT License
function detectIE() {
    var ua = window.navigator.userAgent;

    // IE 10
    // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';

    // IE 11
    // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    // other browser
    return false;
}

// ====================================
// String functions
// ====================================

/**
 * Replace all occurances of substring with given replacement string
 * @param {String} needle - string to find
 * @param {String} replaceWith - string to replace
 * @returns {String}
 */
String.prototype.replaceAll = function (needle, replaceWith) {
    var thisStr = this;
    return thisStr.split(needle).join(replaceWith);
};

// ====================================
// Array functions
// ====================================

Array.prototype.unique = function () {
    var thisArr = this;
    var thisCopy = thisArr.map(function(d){
        return d;
    });
    removeDuplicates(thisCopy);
    return thisCopy;
};

Array.prototype.last = function () {
    var thisArr = this;
    return thisArr[thisArr.length - 1];
};

/**
 * Get the difference between two arrays.
 * @param {object[]} a
 * @return {Array.prototype@call;filter}
 * @source https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
 * @dateretrieved 5/3/2018
 * 
 * Example:
 * [1,2,3,4,5,6].diff( [3,4,5] );  
// => [1, 2, 6]
 */
Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

// ======================================
// Time
// ======================================
function timeNow(){
    var d = new Date();
    return d.getTime();
}

/**
 * Convert database date/time to object
 * @param {string} dbDate
 * @return {object}
 */
function convertDbDate(dbDate){
    if(dbDate === "now"){
        var today = new Date();
        return {
            year: today.getYear(),
            month: today.getMonth(),
            day: today.getDate(),
            hour: today.getHours(),
            minute: today.getMinutes(),
            second: today.getSeconds()
        };
    }
    
    var dtSplit = dbDate.split(" ");
    
    // Get date
    var date = dtSplit[0].split("-").map(function(d){
        return Number(d);
    });
    
    // Get time
    var time = dtSplit[1].split(":").map(function(d){
        return Number(d);
    });
    
    return {
        year: (date[0] - 1900),
        month: (date[1] - 1),
        day: date[2],
        hour: time[0],
        minute: time[1],
        second: time[2]
    };
}

function convertDbTimestamp(dbDate){
    var day = dbDate.split(" ")[0];
    var time = dbDate.split(" ")[1];

    var pieces = {
        year: null,
        month: null,
        day: null,
        hour: null,
        minute: null,
        second: null
    };

    day = day.split("-");
    pieces.year = Number(day[0]);
    pieces.month = Number(day[1]) - 1;
    pieces.day = Number(day[2]);

    time = time.split(":");
    pieces.hour = Number(time[0]);
    pieces.minute = Number(time[1]);
    pieces.second = Number(time[2]);

    var timeStamp = (new Date(pieces.year, pieces.month, pieces.day, pieces.hour, pieces.minute, pieces.second, 0)).getTime();
    return timeStamp;
}

// ======================================
// Preference/Permissions
// ======================================

/**
 * Determine whether or not the current user has permissions associated with the program code
 * @param {string} programCode - the program code
 * @return {Promise(bool)} - true if the user has permission, otherwise false
 */
function hasPermission(programCode){
    return new Promise(function(resolve, reject){
        $.post(gRoot + "../database/has-permission.php", {code: programCode}, function(ret){
            if(ret === "true"){
                resolve(true);
            }else if(ret === "false"){
                resolve(false);
            }else{
                throw Error("Unknown return value: " + ret);
            }
        });
    });
}

/**
 * Get a preference of the current user
 * @param {string} programCode - how the preference is known by the program
 * @return {object} - preference value
 */
function getPreference(programCode){
    // Get the data interface
    return getPreferenceFromDataInterface(programCode, hub);
}
    
/**
 * Get a preference of the current user
 * @param {string} programCode - how the preference is known by the program
 * @param {DataInterface} dataInterface - the data interface
 * @return {object} - preference value
 */
function getPreferenceFromDataInterface(programCode, dataInterface){
    if(dataInterface.id === "hub"){
        return getPreferenceFromHub(programCode, dataInterface);
    }
    
    // Get the preference collection
    var prefCollection  = dataInterface.get("preference"); 

    // Get the preference model
    var pref            = prefCollection.findWhere({program_code: programCode});
    if(typeof pref === 'undefined'){
        return null;
    }
    
    // Get the user's preference data
    var userPrefs       = dataInterface.get("user").get(userID).getPreferences();
    var chosenValue     = userPrefs.filter(function(d){
        return (d.id === pref.id);
    });
    
    // Select the correct value
    var selectedChoice = null;
    if(chosenValue.length > 1){
        throw Error("Too many chosen values for a single preference.");
    }else if(chosenValue.length === 0){
        var defaultValue    = pref.get("defaultvalue");
        selectedChoice  = defaultValue;
    }else{
        selectedChoice  = chosenValue[0].val;
    }
    
    // Get the text for the choice
    var choiceText = selectedChoice;
    if(pref.get("formtype").localeCompare("mc") === 0){
        var choiceText      = pref.get("choices").split(",")[selectedChoice.charCodeAt(0) - 97];
    }
    assertDefined(choiceText);
    
    return choiceText;
};

function getPreferenceChoiceFromHub(programCode, hub){
    // Get the preference collection
    var prefCollection  = hub.get("preference"); 

    // Get the preference model
    var pref            = prefCollection.findWhere({program_code: programCode});
    if(typeof pref === 'undefined'){
        return null;
    }
    
    // Get the user's preference data
    var userPrefCollection = hub.get("userpreference");
    
    var userPrefs = userPrefCollection.where({userid: userID});   
    var chosenValue = userPrefs.filter(function(d){
        return (Number(d.get("preferenceid")) === Number(pref.id));
    });
    
    // Select the correct value
    var selectedChoice = null;
    if(chosenValue.length > 1){
        throw Error("Too many chosen values for a single preference.");
    }else if(chosenValue.length === 0){
        var defaultValue    = pref.get("defaultvalue");
        selectedChoice  = defaultValue;
    }else{
        selectedChoice  = chosenValue[0].get("val");
    }
    return selectedChoice;
}

function getPreferenceFromHub(programCode, hub){
    // Get the preference collection
    var prefCollection  = hub.get("preference"); 

    // Get the preference model
    var pref            = prefCollection.findWhere({program_code: programCode});
    if(typeof pref === 'undefined'){
        return null;
    }
    
    // Get the user's preference data
    var userPrefCollection = hub.get("userpreference");
    
    var userPrefs = userPrefCollection.where({userid: userID});   
    var chosenValue = userPrefs.filter(function(d){
        return (Number(d.get("preferenceid")) === Number(pref.id));
    });
    
    // Select the correct value
    var selectedChoice = null;
    if(chosenValue.length > 1){
        throw Error("Too many chosen values for a single preference.");
    }else if(chosenValue.length === 0){
        var defaultValue    = pref.get("defaultvalue");
        selectedChoice  = defaultValue;
    }else{
        selectedChoice  = chosenValue[0].get("val");
    }
    
    function getChoiceText(choice){ return pref.get("choices").split(",")[choice.charCodeAt(0) - 97]; };
    
    // Get the text for the choice
    var choiceText = selectedChoice;
    if(pref.get("formtype").localeCompare("mc") === 0){
        var choiceText  = getChoiceText(selectedChoice);
    }
    
    // If the choice doesn't make sense then use the default
    if(typeof choiceText === "undefined"){
        choiceText  = getChoiceText(pref.get("defaultvalue"));
    }
    
    return choiceText;
}

/**
 * Gets the name of a new, dynamically created map
 * @return {undefined}
 */
function getMapName(options){
    
    // Determine name base
    var nameBase = "custom";
    switch(options.type){
        case "addtonew":
            var nodeTextID = hub.get("node").get(options.nodeid).get("textid");
            nameBase = nodeTextID + "-submap";
            break;
        case "hourglass":
            var nodeTextID = hub.get("node").get(options.nodeid).get("textid");
            nameBase = nodeTextID + "-hourglass";
            break;
    }
    
    // Get minimized maps
    var topHandle = null;
    var graphManager = application.graphstate;
    if (!graphManager.isEmpty()) {
        topHandle = graphManager.handle();
        while (!graphManager.isEmpty()) {
            graphManager.pop();
        }
    }

    // Get states
    graphManager.pushAll();
    var handles = [topHandle];
    while (!graphManager.isEmpty()) {
        if (graphManager.handle() !== topHandle) {
            handles.push(graphManager.handle());
        }
        graphManager.pop();
    }

    // Restore
    if (topHandle !== null) {
        graphManager.push(topHandle);
    }
   
    var minimizedGraphDefs = handles.map(function(handle){
        graphManager.push(handle);
        var graphDef = graphManager.get();
        graphManager.pop();
        return graphDef;
    }).filter(function(def){
        return !$.isNumeric(def.graphID);
    });
    
    var nameVersion = 0;
    var safety = 1000;
    var name = null;
    while(true){
        name = "_" + nameBase + ((nameVersion === 0) ? "" : "-"+nameVersion);
        if((safety--) < 0){
            throw Error("Safety break");
        }
        
        // Check for existing minimized map with name
        var matching = minimizedGraphDefs.find(function(def){
            return (def.graphID.localeCompare(name) === 0);
        });

        if(typeof matching === 'undefined'){
            break;
        }
        nameVersion++;
        if(nameVersion===1){
            nameVersion++;
        }
    }
    return name;
}

/**
 * Get the model reprenting the currently active standard set
 * @return {Backbone.Model} - the currently active standard set
 */
getActiveSetModel = function(){
    if(hub.get("set").length === 0){
        return null;
    }
    
    // Get the active set name
    var activeSet = appstate.get("activeSet");
    var setModel = hub.get("set").find(function(s){
        return (s.get("name").toLowerCase() === activeSet);
    });
    assertDefined(setModel);
    return setModel;
};

/**
 * Get the model reprenting the currently active standard set
 * @param {Backbone.Model = null} setModel - the currently active set model
 * @return {Backbone.Model} - the currently active standard set
 */
getActiveSubjectModel = function(setModel){
    // Get the active set
    var activeSubject = appstate.get("activeSubject");
    setModel = (setModel === null || typeof setModel === 'undefined') ? getActiveSetModel() : setModel;
    var subjects = hub.wrap(setModel).subjects();
    var subjectModel = subjects.find(function(s){
        return s.get("name").toLowerCase() === activeSubject;
    });
    assertDefined(subjectModel);
    return subjectModel;
};

chain = function(){
    throw Error();
};



/**
 * Return a random integer between min (inclusive) and max (exclusive)
 * 
 * randomInt(1,3) => 1 or 2
 * randomInt(1,4) => 1 or 2 or 3
 * 
 * @source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
 * 
 * @param {number} min - min bound (inclusive)
 * @param {number} max - max bound (exclusive)
 * @return {number}
 */
function randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

/**
 * Return a random double between min (inclusive) and max (exclusive) * 
 * @source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
 * 
 * @param {number} min - min bound (inclusive)
 * @param {number} max - max bound (exclusive)
 * @return {number}
 */
function randomDouble(min, max) {
    return Math.random() < 0.5 ? ((1-Math.random()) * (max-min) + min) : (Math.random() * (max-min) + min);
}


/**
 * Compute the hash of the given thing
 * @type {string|number|object}
 */
function hash(str){
    if(typeof str === "string"){
        var hash = 0, i, chr;
        if (str.length === 0) return hash;
        for (i = 0; i < str.length; i++) {
            chr   = str.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }else if(typeof str === "object"){
        return hash(JSON.stringify(str));
    }else if(typeof str === "number"){
        return hash(str.toString());
    }
};

/*
** Compares two objects 
** @source: https://stackoverflow.com/questions/30476150/javascript-deep-comparison-recursively-objects-and-properties
** @param a, b        - values (Object, RegExp, Date, etc.)
** @returns {boolean} - true if a and b are the object or same primitive value or
**                      have the same properties with the same values
*/
function objectTester(a, b) {
    // Helper to return a value's internal object [[Class]]
    // That this returns [object Type] even for primitives
    function getClass(obj) {
        return Object.prototype.toString.call(obj);
    }

    // If a and b reference the same value, return true
    if (a === b) return true;
  
    // If a and b aren't the same type, return false
    if (typeof a != typeof b) return false;
  
    // Already know types are the same, so if type is number
    // and both NaN, return true
    if (typeof a == 'number' && isNaN(a) && isNaN(b)) return true;
  
    // Get internal [[Class]]
    var aClass = getClass(a);
    var bClass = getClass(b)
  
    // Return false if not same class
    if (aClass != bClass) return false;
  
    // If they're Boolean, String or Number objects, check values
    if (aClass == '[object Boolean]' || aClass == '[object String]' || aClass == '[object Number]') {
        if (a.valueOf() != b.valueOf()) return false;
    }
  
    // If they're RegExps, Dates or Error objects, check stringified values
    if (aClass == '[object RegExp]' || aClass == '[object Date]' || aClass == '[object Error]') {
        if (a.toString() != b.toString()) return false;
    }
  
    // For functions, check stringigied values are the same
    // Almost impossible to be equal if a and b aren't trivial
    // and are different functions
    if (aClass == '[object Function]' && a.toString() != b.toString()) return false;
  
    // For all objects, (including Objects, Functions, Arrays and host objects),
    // check the properties
    var aKeys = Object.keys(a);
    var bKeys = Object.keys(b);
  
    // If they don't have the same number of keys, return false
    if (aKeys.length != bKeys.length) return false;
  
    // Check they have the same keys
    if (!aKeys.every(function(key){return b.hasOwnProperty(key)})) return false;
  
    // Check key values - uses ES5 Object.keys
    return aKeys.every(function(key){
        return objectTester(a[key], b[key])
    });
    return false;
}


/**
 * Checks requirejs to determine whether the package with the given name is
 * avaliable for use. 
 * @param {string} packageName - the name of the package.
 */
function isPackageLoaded(packageName){
    if(typeof requirejs === "undefined"){
        console.warn("requirejs is not defined.");
        return false;
    }
    var config = requirejs.s.contexts._.config;
    if(!config.hasOwnProperty("pkgs")){
        return false;
    }
    return config.pkgs.hasOwnProperty(packageName);
}