/**
 * Encrypts the given email and password pbkdf2 algorithm. This is for authenticating with the bash version.
 * 
 * @author Chris Gayler <cgayler@ku.edu>
 * @summary encrypts for bash version authentication
 * 
 * Modified By: Dain Vermaak
 * Modified On: 5/31/2017
 * Modified: Moved code to its own file, cleaned up and added a little documentation
 */

"use strict";

/**
 * Attempt to encrypt using pbkdf2 algorithm for a user
 * @param {string} email - the user's email
 * @param {string} password - the user's password
 * @return {string} the hashed passphrase encrypted using the algorithm 
 */
function tryPBKDF2(email, password)
{

    var email       = email.toLowerCase();
    var passphrase  = password;
    var salt        = email + "some extra salt \uD83D\uDF14";
    var iterations  = 1024*1024;

    return new Promise(function(resolve, reject){
        newHashPassphrase(passphrase, salt, iterations, function(pbkdf2Hex){
            resolve(pbkdf2Hex);
        });
    });
}

function newHashPassphrase(passphrase, salt, iterations, callback)
{
    var stringToHex = function(string) {
        return string.split("").map(function(char) {
            return ("000" + (char.charCodeAt(0).toString(16))).slice(-4);
        }).join("");
    };

    var chooseAMethod = function(passphrase, salt, iterations, callback) {
        if(typeof crypto !== 'object' || typeof crypto.subtle !== 'object' || typeof TextEncoder !== 'function'){
            hashAsmcrypto(passphrase, salt, iterations, callback);
        }else{
            hashCryptoAPI(passphrase, salt, iterations, callback);
            
        }
    };

    var hashAsmcrypto = function(passphrase, salt, iterations, callback) {
        passphrase = stringToHex(passphrase);
        salt = stringToHex(salt);

        var worker = new Worker(gRoot+"crypt/asmcrypto.js");
        worker.onmessage = function(message) {
            var hash = message.data;
            console.log(hash + " in " + Math.floor(performance.now() - start) + " ms using asmcrypto");
            callback(hash);
        };
        var start = performance.now();
        worker.postMessage([passphrase, salt, iterations]);
    };

    var hashCryptoAPI = function(passphrase, salt, iterations, callback) {
        passphrase = stringToHex(passphrase);
        salt = stringToHex(salt);

        var bytesToHex = function (arrayBuffer) {
            var byteArray = new Uint8Array(arrayBuffer);
            var hexString = "";
            for (var i=0; i<byteArray.byteLength; i++)
                hexString += ("0" + byteArray[i].toString(16)).slice(-2);
            return hexString;
        };

        var start = performance.now();
        var passBytes = (new TextEncoder("utf-8")).encode(passphrase);
        var cryptoPromise = crypto.subtle.importKey(
            "raw", passBytes, {name: "PBKDF2"}, false, ["deriveBits"]
        )
        .then(function(baseKey){
            return crypto.subtle.deriveBits({
                name: "PBKDF2",
                salt: (new TextEncoder("utf-8")).encode(salt),
                iterations: iterations,
                hash: {name: "SHA-1"}
            }, baseKey, 160);
        })
        .then(function(keyBuffer) {
            var keyBytes = new Uint8Array(keyBuffer);
            return bytesToHex(keyBytes);
        })
        .then(function(hash) {
            console.log(hash + " in " + Math.floor(performance.now() - start) + " ms using Crypto API");
            callback(hash);
        })
        // Claims to not exist
        .catch(function(err) {
            throw Error(err);
        });
    };

    chooseAMethod(passphrase, salt, iterations, callback);
}