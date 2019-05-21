<?php

// Set up the headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: *");
header("Access-Control-Allow-Headers: *");

// Check user login and connect to database
if(!isset(ELM_ROOT)){
    require_once("../../../ajax.php");
}

// Get the request mehtod
$requestMethod = filter_input(INPUT_SERVER, "REQUEST_METHOD");

// Setup the response object
$json = array("method" => $requestMethod);

// Get data sent from client
$data = json_decode(file_get_contents("php://input"));
if($data != NULL){
    $json["data"] = $data;
}

if(strcmp($requestMethod, "DELETE") == 0){
    echo "METHOD:DELETE";
    exit();
}

// Respond
echo json_encode($json);
?>

