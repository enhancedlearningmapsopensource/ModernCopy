define([], function(){
    class EnforcedType{
        /**
         * Create a new EnforcedType object
         * @param {string} type - type to enforce
         */
        constructor(type){
            this.enforceAs(type);
        }
        
        /**
         * @param {string} type - type to enforce
         */
        enforceAs(type){
            var thisClass = this;
            thisClass._enforcedType = type;
        }
        
        /**
         * Get the enforced type of an object
         * @param {type} ob - object to check 
         * @returns {string|null} - the enforced type of the object 
         */
        static typeOf(ob){
            if(ob.hasOwnProperty("_enforcedType")){
                return ob._enforcedType;
            }else{
                return null;
            }
        }
    }
    return EnforcedType;
});

