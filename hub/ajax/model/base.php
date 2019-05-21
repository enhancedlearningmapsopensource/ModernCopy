<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: *");
header("Access-Control-Allow-Headers: *");

if(!defined("ELM_ROOT")){
    require_once("../../../database/core.php");
    require_once(ELM_ROOT . "database/ajax.php");
}

require_once("../utility/sanitize.php");

// Get the request mehtod
$requestMethod = filter_input(INPUT_SERVER, "REQUEST_METHOD");
if(strlen(trim($requestMethod)) == 0){
    $requestMethod = $_SERVER["REQUEST_METHOD"];
    if(strlen(trim($requestMethod)) == 0){
        PreVarDump($_SERVER);
        throw new Exception("Could not find a request method.");
    }
}

// Setup the response object
$json = array("method" => $requestMethod);

// Get data sent from client
$data = file_get_contents("php://input");
if($data != NULL){
    // Decode the data into an array
    $decoded = json_decode($data, TRUE);
    foreach($decoded as $k => $d){
        if(is_array($d)){
            throw new Exception("array passed as input");
        }else if(is_numeric ($d)){
            $decoded[$k] = $d;
        }else{
            try{
                $decoded[$k] = Sanitize(Unsanitize($d));
            }catch(Exception $ex){
                $decoded[$k] = Sanitize($d);
            }
        }
    }
    
    $json["data"] = $decoded;
}

// Check for ID
$queryString = isset($_SERVER["QUERY_STRING"]) ? $_SERVER["QUERY_STRING"] : ""; //filter_input(INPUT_SERVER, "QUERY_STRING", FILTER_SANITIZE_STRING);
$pathInfo = isset($_SERVER["PATH_INFO"]) ? $_SERVER["PATH_INFO"] : "";

if(strlen(trim($queryString)) > 0){
    $queryParts = explode("/", $queryString);
    if(count($queryParts) > 1){
        $id = $queryParts[1];
    }
}

// Verify using path info if query string fails
if(!isset($id)){
    if(strlen(trim($pathInfo)) > 0){
        $queryParts = explode("/",$pathInfo);
        if(count($queryParts) > 1){
            $id = $queryParts[1];
        }
    }
}

require_once("../utility/base-functions.php");

switch($requestMethod){
    case "DELETE":
        if(isset($id)){
            echo json_encode(Delete($id));
        }else{
            PreVarDump($_SERVER);
            echo "\$_SERVER[\"QUERY_STRING\"] => " . $_SERVER["QUERY_STRING"] . "\n";
            throw new Exception("Missing id for delete. PathInfo: [$pathInfo], QueryString: [$queryString]");
        }
        break;
    case "GET":
        if(isset($id)){
            echo json_encode(GetOne($id));
        }else{
            echo json_encode(GetAll());
        }
        break;
    case "POST":
        echo json_encode(Post($decoded));
        break;
    case "PUT":
        echo json_encode(Put($decoded));
        break;
    default: 
        PreVarDump($_SERVER);
        throw new Exception("Unknown request method: $requestMethod");
}








?>

