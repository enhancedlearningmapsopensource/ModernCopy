define([],function(){
    class FontManager{
        constructor(font){
            var thisClass = this;
            var json = JSON.parse(font);
            var compiled = {};
            json.forEach(function(j){
                var k = Object.keys(j);
                k = k[0];
                compiled[k] = j[k];
            });
            
            thisClass.font = compiled;
        }
        
        getWidth(word, font){
            var thisClass = this;
            
            var fontSize = font.size;
            assertDefined(fontSize);
            
            var font = thisClass.font[fontSize];
            assertDefined(font, "no font of size: " + fontSize);
            
            var chars = word.split('');
            
            chars = chars.map(function(d){
                return (d == ' ' || d == ',' || d == '<' || d == '>' || d == '(' || d == ')' || d == '[' || d == ']') ? 'a' : d;
            });
            
            var charW = [];
            
            assert(font.hasOwnProperty(chars[0]), "could not find: " + chars[0]);
            charW[0] = font[chars[0]][null];
            for(var c = 1; c < chars.length; c++){
                var curr = chars[c];
                var prev = chars[c-1];
                
                assert(font.hasOwnProperty(curr), "could not find: " + curr);
                assert(font[curr].hasOwnProperty(prev), "could not find: " + curr + " after " + prev);
                
                charW[c] = font[curr][prev];
            }
            
            charW.forEach(function(d){
                assert(d > 0);
            });
            
            return charW.reduce(function(sum, val){
                return sum+val;
            },0);
        }
    }
    
    return FontManager;
})


