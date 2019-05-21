<?php

function PreVarDumpPost($title = "") {
    $bt = debug_backtrace();
    $rootCaller = array_shift($bt);
    //$var['backtrace'] = ;

    PreVarDump($_POST, $title, $rootCaller['file'] . "(" . $rootCaller['line'] . ")");
}

function PreVarDump($var, $title = "", $backtrace = "") {
    if (!isset($var)) {
        throw new Exception("No value provided for var");
    }

    $pVar = (!is_array($var)) ? array($var) : $var;

    $bt = debug_backtrace();
    $rootCaller = array_shift($bt);
    $pVar['backtrace'] = ($backtrace == "") ? $rootCaller['file'] . "(" . $rootCaller['line'] . ")" : $backtrace;
    //array_unshift($pVar, $pVar['backtrace']);

    echo "<pre>";
    echo ($title == "") ? "" : "<h4>$title</h4>";
    var_dump($pVar);
    echo "</pre>";
}

function GetRecover($postString, $default = "") {
    return (isset($_GET[$postString])) ? $_GET[$postString] : $default;
}

/**
 * Checks to see if the current user has the given permission
 * @param {string} $programCode - the program code
 */
function HasPermission($programCode) {
    global $database;
    return $database->HasPermission($programCode, $_SESSION["ELM_EMAIL"]);
}

/**
 * Get the config options.
 */
function Config() {
    global $database;

    $result = $database->PrototypeQuery("SELECT * FROM ELM_CONFIG");

    $config = [];
    while($row = $database->fetch($result)){
        $config[$row["CODE"]] = $row["VAL"];
    }
    return json_encode($config);
}

function PostRecover($postString, $default = "") {
    return (isset($_POST[$postString])) ? $_POST[$postString] : $default;
}

function require_root($url) {
    $pPath = ELM_ROOT . $url;
    if (!file_exists($pPath)) {
        throw new Exception("Cannot find file:  $pPath");
    }
    require_once($pPath);
}

function WriteTemplate($path, $jsID) {
    echo "<script id='$jsID' type='x-tmpl-mustache'>";
    echo file_get_contents($path);
    echo "</script>";
}

/**
 * Author: craig@craigfrancis.co.uk
 * URL: http://php.net/manual/en/function.http-response-code.php#107261
 * Included By: Dain Vermaak
 * Included On: 5/5/2017
 */
if (!function_exists('http_response_code')) {

    function http_response_code($code = NULL) {
        if ($code !== NULL) {
            switch ($code) {
                case 100: $text = 'Continue';
                    break;
                case 101: $text = 'Switching Protocols';
                    break;
                case 200: $text = 'OK';
                    break;
                case 201: $text = 'Created';
                    break;
                case 202: $text = 'Accepted';
                    break;
                case 203: $text = 'Non-Authoritative Information';
                    break;
                case 204: $text = 'No Content';
                    break;
                case 205: $text = 'Reset Content';
                    break;
                case 206: $text = 'Partial Content';
                    break;
                case 300: $text = 'Multiple Choices';
                    break;
                case 301: $text = 'Moved Permanently';
                    break;
                case 302: $text = 'Moved Temporarily';
                    break;
                case 303: $text = 'See Other';
                    break;
                case 304: $text = 'Not Modified';
                    break;
                case 305: $text = 'Use Proxy';
                    break;
                case 400: $text = 'Bad Request';
                    break;
                case 401: $text = 'Unauthorized';
                    break;
                case 402: $text = 'Payment Required';
                    break;
                case 403: $text = 'Forbidden';
                    break;
                case 404: $text = 'Not Found';
                    break;
                case 405: $text = 'Method Not Allowed';
                    break;
                case 406: $text = 'Not Acceptable';
                    break;
                case 407: $text = 'Proxy Authentication Required';
                    break;
                case 408: $text = 'Request Time-out';
                    break;
                case 409: $text = 'Conflict';
                    break;
                case 410: $text = 'Gone';
                    break;
                case 411: $text = 'Length Required';
                    break;
                case 412: $text = 'Precondition Failed';
                    break;
                case 413: $text = 'Request Entity Too Large';
                    break;
                case 414: $text = 'Request-URI Too Large';
                    break;
                case 415: $text = 'Unsupported Media Type';
                    break;
                case 500: $text = 'Internal Server Error';
                    break;
                case 501: $text = 'Not Implemented';
                    break;
                case 502: $text = 'Bad Gateway';
                    break;
                case 503: $text = 'Service Unavailable';
                    break;
                case 504: $text = 'Gateway Time-out';
                    break;
                case 505: $text = 'HTTP Version not supported';
                    break;
                default:
                    exit('Unknown http status code "' . htmlentities($code) . '"');
                    break;
            }

            $protocol = (isset($_SERVER['SERVER_PROTOCOL']) ? $_SERVER['SERVER_PROTOCOL'] : 'HTTP/1.0');

            header($protocol . ' ' . $code . ' ' . $text);

            $GLOBALS['http_response_code'] = $code;
        } else {
            $code = (isset($GLOBALS['http_response_code']) ? $GLOBALS['http_response_code'] : 200);
        }
        return $code;
    }

}

/**
 * 
 * Find the relative file system path between two file system paths
 *
 * @param  string  $frompath  Path to start from
 * @param  string  $topath    Path we want to end up in
 *
 * @author ohaal
 * @url: https://gist.github.com/ohaal/2936041
 *
 * @return string             Path leading from $frompath to $topath
 */
function find_relative_path($frompath, $topath) {
    $from = explode(DIRECTORY_SEPARATOR, $frompath); // Folders/File
    $to = explode(DIRECTORY_SEPARATOR, $topath); // Folders/File
    $relpath = '';

    $i = 0;
    // Find how far the path is the same
    while (isset($from[$i]) && isset($to[$i])) {
        if ($from[$i] != $to[$i])
            break;
        $i++;
    }
    $j = count($from) - 1;
    // Add '..' until the path is the same
    while ($i <= $j) {
        if (!empty($from[$j]))
            $relpath .= '..' . DIRECTORY_SEPARATOR;
        $j--;
    }
    // Go to folder from where it starts differing
    while (isset($to[$i])) {
        if (!empty($to[$i]))
            $relpath .= $to[$i] . DIRECTORY_SEPARATOR;
        $i++;
    }

    // Strip last separator
    return substr($relpath, 0, -1);
}

/**
 * Get the structure of the given directory as an array.
 * @param {string} dir - the directory.
 * @param {boolean} recurse - if true then the directory subfolders are included.
 * @return {array} - the structure of the given directory as an array.
 */
function dirToArray($dir, $recurse = true) {
    $result = array();
    $cdir = scandir($dir);
    foreach ($cdir as $key => $value) {
        if (!in_array($value, array(".", ".."))) {
            if (is_dir($dir . DIRECTORY_SEPARATOR . $value)) {
                if($recurse){
                    $result[$value] = dirToArray($dir . DIRECTORY_SEPARATOR . $value);
                }else{
                    $result[] = $value;
                }
            } else {
                $result[] = $value;
            }
        }
    }
    return $result;
}

/**
 * Get the structure of the given directory as an array. In each case the full path to the file is given.
 * @param {string} dir - the directory.
 * @param {boolean} recurse - if true then the directory subfolders are included.
 * @return {array} - the structure of the given directory as an array.
 */
function dirToArrayFull($dir, $recurse = true) {
    $result = array();
    $cdir = scandir($dir);
    foreach ($cdir as $key => $value) {
        if (!in_array($value, array(".", ".."))) {
            if (is_dir($dir . DIRECTORY_SEPARATOR . $value)) {
                if($recurse){
                    $result[$value] = dirToArrayFull($dir . DIRECTORY_SEPARATOR . $value);
                }else{
                    $result[] = $value;
                }
            } else {
                $result[] = $dir . DIRECTORY_SEPARATOR . $value;
            }
        }
    }
    return $result;
}

function dirToArrayIgnore($dir, $ignore, $restricter = -1) {
    //$result = array();
    $cleanDir = realpath($dir);//str_replace("/", DIRECTORY_SEPARATOR, str_replace("\\", DIRECTORY_SEPARATOR, $dir));
    $cleanIngore = array_map(function($d){
        return realpath($d);//str_replace("/", DIRECTORY_SEPARATOR, str_replace("\\", DIRECTORY_SEPARATOR, $d));
    }, $ignore);

    //var_dump($cleanIngore);
    
    /*while($cleanDir[strlen($cleanDir) - 1] == DIRECTORY_SEPARATOR){
        $cleanDir = substr($cleanDir, 0, strlen($cleanDir) - 1);
    }*/
    return dirToArrayIgnoreItt($cleanDir, $cleanIngore, $restricter);
}

function dirToArrayIgnoreItt($dir, $ignore, $restricter = -1) {
    if($restricter == 0){
        return array();
    }

    $result = array();
    $cdir = scandir($dir);
    foreach ($cdir as $key => $value) {
        if (!in_array($value, array(".", ".."))) {
            $path = realpath($dir . DIRECTORY_SEPARATOR . $value);
            if(!in_array($path, $ignore)){
                //echo $path . "<br />";
                if (is_dir($path)) {
                    $result[$value] = dirToArrayIgnoreItt($path, $ignore, $restricter - 1);
                } else {
                    $result[] = $value;
                }
            }
        }
    }
    return $result;
}

/**
 * Convert php shorthand (e.g. 32K, 18G, 2M) to bytes
 * @param {string} $val - value to convert
 * @return int - bytes
 * @source - https://stackoverflow.com/questions/6846445/get-byte-value-from-shorthand-byte-notation-in-php-ini
 */
function convertBytes($val){
    $val  = trim($val);

    $last = strtolower($val[strlen($val)-1]);
    $val  = substr($val, 0, -1); // necessary since PHP 7.1; otherwise optional

    switch($last) {
        // The 'G' modifier is available since PHP 5.1.0
        case 'g':
            $val *= 1024;
        case 'm':
            $val *= 1024;
        case 'k':
            $val *= 1024;
    }

    return $val;
}

/**
 * Get the standard set selected by the given user.
 * @param {object} $database - the database
 * @param {number} $userID - the ID of the user.
 * @return {string} - the chosen standard set e.g. "a", "b", etc.
 */
function GetSelectedStandardSet($database, $userID){
    
    $setProgramCode =  "SSET";
    $result = $database->PrototypeQuery("SELECT * FROM ELM_USERPREFERENCE AS UP LEFT JOIN ELM_PREFERENCE AS P ON UP.PREFERENCEID=P.PREFERENCEID WHERE UP.USERID=? AND P.PROGRAM_CODE LIKE ?", array(&$userID, &$setProgramCode));
    if(!isset($result["result"])){
        $sset = "a";
    }else{
        $row = $database->fetch($result);
        $sset = $row["VAL"];
    }
    return $sset;
}

/**
 * Print out the css links if the file is a css file.
 * @param {string} $file - name of the file
 * @param {string} $path - path to the file
 */
function printIfCssLink($file, $path){
    $p = explode(".", $file);
    if(strcmp(trim(array_pop($p)), "css") == 0){
        ?><link href="<?=$path.$file?>" rel="stylesheet" /><?php
    }
}

function trace($files, $path){
    foreach($files as $k => $f){
        if(is_array($f)){
            trace($f, $path . $k . "/");
        }else{
            printIfCssLink($f, $path);
        }
    }
}

/**
 * Print out the links to all css files in the given library
 * @param {string} $root - path to the library folder
 */
function printLibraryCss($root){
    if(is_array($root)){
        foreach($root as $r){
            printLibraryCss($r);
        }
        return;
    }
    
    if(!is_string($root)){
        throw new Exception("Path provided is not a string but should be.");
    }
    $r = substr($root, strlen($root) - 1) == "/" ? $root : $root . "/";

    // Include all css files within the js library 
    $lib = dirToArray($r);
    
    trace($lib, $r);
}

/**
 * Get the last time the file with the given path was modified.
 * @param {string} filePath - the path to the file.
 * @return {date} - the last time the file was modified.
 * 
 * @source http://php.net/manual/en/function.filemtime.php
 * @author - Original author seems to be Dustin Oprea
 * 
 * Use date("Y-m-d H:i:s", GetLastModifiedTime(...)) to get the string version.
 */
function getLastModifiedTime($filePath) { 
    $time = filemtime($filePath); 

    $isDST = (date('I', $time) == 1); 
    $systemDST = (date('I') == 1); 

    $adjustment = 0; 

    if($isDST == false && $systemDST == true) 
        $adjustment = 3600; 
    
    else if($isDST == true && $systemDST == false) 
        $adjustment = -3600; 

    else 
        $adjustment = 0; 

    return ($time + $adjustment); 
} 

?>