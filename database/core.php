<?php
//=========== PREVENT CACHING =======================
//header("Cache-Control: no-cache, no-store, must-revalidate"); // HTTP 1.1.
//header("Pragma: no-cache"); // HTTP 1.0.
//header("Expires: 0"); // Proxies.

if(!defined("ELM_ROOT")){
    define("ELM_ROOT", GetRoot());
}


header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

// Session is going to be required so restrict it.
session_cache_limiter('private');
session_cache_expire(0);
 
//=========== DEFINE CONSTANTS =========================
define("USE_CROSS_VERSION_LOGIN", true);
define("BACKBONE_PROMISE", "backbone-promise/");
define("MODERN_SESSION", "MODERN_SESSION_ID");

//=========== FORCE USE OF HTTPS =======================
forceHttps();

//=========== SET TIMEZONE =======================
date_default_timezone_set('America/Chicago');

//=========== PHP ERROR REPORTING ================
error_reporting(E_ALL);
ini_set("display_errors", 1);

//=========== DATETIME ZERO ======================
define("TIME_ZERO", "1970-01-01 00:00:00");

//=========== CONFIG FILE PATH ===================
define("CONFIG_FILE_PATH", ELM_ROOT . "database/elm_config.php");

// Provide Database Access
define("DATABASE_PATH", ELM_ROOT . "database/database.php");
if(!is_file(DATABASE_PATH)){
    throw new Exception("Cannot find database file: " . DATABASE_PATH);
}

// Load the database
require_once(DATABASE_PATH);
if(file_exists(CONFIG_FILE_PATH)){
    require_once(CONFIG_FILE_PATH);
}

function forceHttps() {
    if ($_SERVER["HTTPS"] != "on") {
        header("Location: https://" . $_SERVER["HTTP_HOST"] . $_SERVER["REQUEST_URI"]);
        exit();
    }
}

function GetRoot(){
    $caller = getcwd();
    $caller = str_replace('/', '\\', $caller);
    $files = explode('\\', $caller);
    $server = $files[0];

    $pBroken = false;
    $pPath = "";
    $pRootKnown = false;
    $pRoot = "";
    foreach($files as $f){
        $pPath = $pPath . $f . DIRECTORY_SEPARATOR;
        $cdir = scandir($pPath);
        //var_dump($cdir);
        if($pRootKnown == true){
            $pRoot .= "../";
        }else{
            if (in_array("__root", array_values($cdir))) {
                $pRootKnown = true;
            }
        }
    }
    return $pRoot;
}

function GetLocalRoot($sitefolder = "public_html", $loud = false, &$server) {
    if ($loud) {
        $bt = debug_backtrace();
        $rootCaller = array_shift($bt);
        echo "<br />Caller Backtrace: " . $rootCaller['file'] . "<br />";
    }

    $caller = getcwd();

    if ($loud) {
        echo "file: " . $caller . "<br />";
        echo "direname(__DIR__): " . dirname(__DIR__) . "<br />";
    }

    $caller = str_replace('/', '\\', $caller);

    $files = explode('\\', $caller);
    $server = $files[0];

    $pBroken = false;
    $pPath = "";
    if ($loud) {
        for ($i = 0; $i < (count($files) - 1); $i++) {
            $f = $files[$i];
            echo "files[$i]: $f <br />";
        }
        echo "<br /><br />";
    }

    if ($loud) {
        echo "<table>";
    }
    for ($i = 0; $i < (count($files)); $i++) {//$files as $f){
        if ($loud) {
            echo "<tr>";
        }
        $f = $files[$i];
        if ($pBroken) {
            if ($loud) {
                echo "<td>..$f</td>";
            }
            $pPath = "../$pPath";
        } else if ($loud) {
            echo "<td>$f</td>";
        }

        if (strcmp($f, $sitefolder) == 0) {
            if ($loud) {
                echo "<td>($f == $sitefolder)</td>";
            }
            $server = $files[$i - 1];
            if ($loud) {
                echo "<td>server: $server)</td>";
            }
            if(strlen(trim($pPath)) == 0){
                $pPath = "../$sitefolder/";
            }
            $pBroken = true;
        } else if ($loud) {
            echo "<td>($f != $sitefolder)</td>";
        }
        if ($loud) {
            echo "<td>Path: $pPath</td></tr>";
        }
    }
    if ($loud) {
        echo "</table>";
    }

    if ($loud) {
        echo "<br />$pPath<br />";
    }

    return $pPath;
}

//=========== INCLUDE CORE FUNCTIONS =======================
require_once(ELM_ROOT . "database/core-functions.php");
?>