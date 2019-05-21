<?php

header('Location: ../');
exit();

// Enforce https
$url = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";

// Load core functions
if(!defined("ELM_ROOT")){
    require_once("../database/core.php");
}
    
//=========== CHECK FILE SIZE =================
$uploadMaxFilesize = convertBytes(ini_get("upload_max_filesize"));
$memoryLimit = convertBytes(ini_get("memory_limit"));
$postMaxSize = convertBytes(ini_get("post_max_size"));

// Check that post size less than the upload size
if($uploadMaxFilesize > $postMaxSize){
    throw new Exception("upload_max_filesize > post_max_size. Please increate post_max_size so that it is greater than upload_max_filesize.");
}

// Check that post size less than the memory limit constraints
if($postMaxSize > $memoryLimit){
    throw new Exception("post_max_size > memory_limit. Please increate memory_limit so that it is greater than post_max_size.");
}

// Connect to the database
$database = Db();
$database->Connect();

// Alias get
$get = $_GET;

// Load the main screen
require_once(ELM_ROOT . "elm/main/full-screen.php");
die();
?>