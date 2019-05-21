define(["jsclass!3rdParty/jsclass/"],
function (JsClass) {
    class JsonParser{
        constructor() {
            this.grammar = new JsClass.Hash();
            this.grammar.store("N", /^WW*$/);
            this.grammar.store("N_", /^\[N(,N)*\]$/);
            this.grammar.store("I", /^N:(N|N_|O|O_|A)$/);
            this.grammar.store("O", /^\{(I(,I)*)?\}$/);
            this.grammar.store("O_", /^\[O(,O)*\]$/);
            this.grammar.store("A", /^\[(\{\})?\]$/);
        }

        subToken(str, ptr, len, subTokens) {
            var substr = "";
            for (var s = ptr; s < ptr + len; s++) {
                substr += str[s].v;
                subTokens.push(str[s]);
            }
            return substr;
        }

        printStr(str) {
            var p = "";
            for (var i = 0; i < str.length; i++) {
                if (str[i].s.length > 0) {
                    p += printStr(str[i].s);
                } else {
                    p += str[i].v;
                }
            }
            return "(" + p + ")";
        }

        printTokens(str) {
            var p = "";
            for (var i = 0; i < str.length; i++) {
                p += str[i].v;
            }
            return p;
        }


        parseGrammar(str, grammar, num) {
            var thisClass = this;
            var ptr = 0;
            var len = 2;
            while (ptr < (str.length - (num - 1))) {
                len = num;
                var subTokens = [];
                var substr = thisClass.subToken(str, ptr, len, subTokens);


                var found = false;
                grammar.forEach(function (g) {
                    if (found) {
                        return;
                    }


                    if (str.length == 5) {
                        var k = 0;
                    }
                    found = substr.match(g.value);

                    if (!found) {
                        return;
                    }


                    // Try to consume as much as possible
                    while (found) {
                        len++;
                        if (ptr + len >= str.length) {
                            break;
                        }
                        subTokens = [];
                        substr = thisClass.subToken(str, ptr, len, subTokens);
                        found = substr.match(g.value);
                    }
                    len--;
                    subTokens = [];
                    substr = thisClass.subToken(str, ptr, len, subTokens);

                    var newToken = { t: g.key, s: subTokens, v: g.key };
                    str.splice(ptr, len, newToken);
                    found = true;

                });
                ptr++;
            }
        }

        parse(url) {
            var thisClass = this;
            var urlOrig = url;
            var urlTokenized = [];
            for (var c = 0; c < url.length; c++) {
                var s = url[c];
                if (s == ':' || s == '{' || s == '}' || s == '[' || s == ']' || s == ',') {
                    urlTokenized.push({ t: "CHAR", v: s, s: [] });
                } else {
                    urlTokenized.push({ t: "W", v: "W", s: [{ t: "CHAR", v: s, s: [] }] });
                }
            }
            //console.log(thisClass.printTokens(urlTokenized));

            var ob = {};
            var prevP = "";
            var p = thisClass.printTokens(urlTokenized);
            var num = 2;
            while (num <= urlTokenized.length) {
                prevP = p;
                thisClass.parseGrammar(urlTokenized, thisClass.grammar, num);
                p = thisClass.printTokens(urlTokenized);
                if (p != prevP) {
                    num = 1;
                    //console.log(p);
                } else {
                    num++;
                }
            }

            console.assert(p == "O");

            function unpack(urlTokenized) {
                var s = "";
                for (var i = 0; i < urlTokenized.length; i++) {
                    var token = urlTokenized[i];

                    if (token.s.length > 0) {
                        if (token.t == "N") {
                            s += '"' + unpack(token.s) + '"';
                        } else {
                            s += unpack(token.s);
                        }
                    } else {
                        s += token.v;
                        //urlTokenized[i] = token.v;
                    }
                }
                return s;
            }
            //unpack(urlTokenized);
            //JSON.stringify(urlTokenized);

            return JSON.parse(unpack(urlTokenized));
        }

        stringify(json) {
            return JSON.stringify(json).replace(/['"]+/g, '');
        }
    }



    return JsonParser;
});