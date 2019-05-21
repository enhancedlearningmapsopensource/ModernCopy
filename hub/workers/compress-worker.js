self.importScripts("../../external-lib/lz-string/v1.4.4/lz-string-min.js");
self.onmessage = function (msg) {
    var raw = msg.data;
    var compressed = self.LZString.compress(raw);
    
    postMessage(compressed);
};