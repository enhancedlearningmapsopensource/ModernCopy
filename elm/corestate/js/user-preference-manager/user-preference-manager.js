define([],
function () {

    var pvt = {
        consts: {
            AJAX: gRoot + "corestate/js/user-preference-manager/ajax/get-preferences.ajax.php"
        }
    };

    class UserPreferenceManager {
        constructor(programState){
            throw Error();
            var thisClass = this;
            thisClass.programState = programState;
            thisClass.requests = [];
            thisClass.prefInfo = [];

            $.post(pvt.consts.AJAX, {}, function (ret) {
                thisClass.prefInfo = JSON.parse(ret);
                var prefInfo = thisClass.prefInfo;
                prefInfo.forEach(function (pref) {
                    pref.prefString = pref.name.toLowerCase();
                    pref.prefString = pref.prefString.replace(/ /g, "_");

                    if (pref.value === null) {
                        pref.value = pref.default;
                    }

                    if (pref.type == "mc") {
                        var selectedChoice = pref.value;
                        selectedChoice = selectedChoice.charCodeAt(0);
                        var indexOfA = "a".charCodeAt(0);

                        var choiceIndex = selectedChoice - indexOfA;
                        var choiceText = pref.choices[choiceIndex].toLowerCase();
                        pref.value = choiceText;
                    } else {
                        pref.value = (pref.value == "t");
                    }
                });
            });

        }

        /**
    	 * Get the current value of a user preference, the default
    	 * value if none has been set, or null if no such preference
    	 * exists.
    	 * 
 		 * @param {String} prefString - the string id for the user preference
 		 * @param {function(prefString, value)} callback - a callback function to deliver the value
    	 */
        getPreference(prefString, callback){
            var thisClass = this;
            var requests = thisClass.requests;
            requests.push({prefString: prefString, callback: callback});
            pvt.handlePreferenceRequests.call(thisClass);
        }


    }

    /**
     * Find the preference in the given list of preferences
     * @param {String} prefString - the string id of the preference to find
     * @param {Array} preferenceSet - the list of preferences and their respective values 
     */
    pvt.getPrefFromList = function (prefString, preferenceSet) {
        for (var i = 0; i < preferenceSet.length; i++) {
            if (preferenceSet[i].prefString == prefString) {
                return preferenceSet[i].value;
            }
        }
        return null;
    };

    /**
     * Look through all requests and attempt to answer as 
     * many as possible.
     */
    pvt.handlePreferenceRequests = function () {
        var thisClass = this;
        var requests = thisClass.requests;
        if (requests.length == 0) {
            return;
        }

        var preferenceSet = thisClass.prefInfo;
        if (preferenceSet.length == 0) {
            return;
        }

        var currRequest = null;
        while (requests.length > 0) {
            currRequest = requests.shift();
            currRequest.callback(currRequest.prefString, pvt.getPrefFromList(currRequest.prefString, preferenceSet));
        }
    };

    

    return UserPreferenceManager;
});