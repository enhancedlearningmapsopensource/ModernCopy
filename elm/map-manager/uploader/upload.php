<?php

require_once("../../../database/core.php");
require_once(ELM_ROOT . "database/ajax.php");

define("FILE_ID", "file-0");
//echo getcwd();
define("TARGET_DIR", ELM_ROOT . "elm/assets/uploads/");
define("LOADER_DIR", "../assets/uploads/");     // Path from the 'thing' that loads the resource to the upload folder

// Verify that the target directory exists
if(!file_exists(TARGET_DIR)){
    // Try to create directory
    mkdir(TARGET_DIR);
    echo compileError("(Line " .__LINE__. ") Target directory (" . TARGET_DIR . ") does not exist.");
    exit;
}

// Check for error
$error = handleFileError($_FILES[FILE_ID]["error"]);
if($error != null){
    echo compileError("(Line " .__LINE__. ") " . $error);
    exit;
}

// Get the file name
$name = basename($_FILES[FILE_ID]["name"]);

// Get the file type
$fileType = strtolower(pathinfo($name, PATHINFO_EXTENSION));

// Add the resource to the database
$resourceID = $database->AddResource($name, "", "", "n/a");

// Set the destination file
$destination = TARGET_DIR . "res_" . $resourceID . "." . $fileType;
$loaderDest = LOADER_DIR . "res_" . $resourceID . "." . $fileType;

// Update the url
$database->PrototypeQueryQuiet("UPDATE ELM_RESOURCE SET URL=? WHERE RESOURCEID=?", array(&$loaderDest, &$resourceID));

// Make sure that the new file is unique 
if(file_exists($destination)){
    echo compileError("(Line " .__LINE__. ") File already exists: $destination");
    exit;
}

// Move file to new home
move_uploaded_file($_FILES[FILE_ID]["tmp_name"], $destination);

// Verify that the move worked
if(!file_exists($destination) || file_exists($_FILES[FILE_ID]["tmp_name"])){
    echo compileError("(Line " .__LINE__. ") File was not transfered: $destination");
    exit;
}

// Compile return information
echo json_encode(array(
    "success" => true,
    "resourceid" => $resourceID
));

function compileError($msg){
    return json_encode(array(
        "success" => false,
        "error" => $msg
    ));
}

function handleFileError($error){
    $valid = false;
    
    switch ($error) {
        case UPLOAD_ERR_OK:
            $valid = true;
            break;
        case UPLOAD_ERR_INI_SIZE:
            $response = 'The uploaded file exceeds the upload_max_filesize directive in php.ini.';
            break;
        case UPLOAD_ERR_FORM_SIZE:
            $response = 'The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form.';
            break;
        case UPLOAD_ERR_PARTIAL:
            $response = 'The uploaded file was only partially uploaded.';
            break;
        case UPLOAD_ERR_NO_FILE:
            $response = 'No file was uploaded.';
            break;
        case UPLOAD_ERR_NO_TMP_DIR:
            $response = 'Missing a temporary folder. Introduced in PHP 4.3.10 and PHP 5.0.3.';
            break;
        case UPLOAD_ERR_CANT_WRITE:
            $response = 'Failed to write file to disk. Introduced in PHP 5.1.0.';
            break;
        case UPLOAD_ERR_EXTENSION:
            $response = 'File upload stopped by extension. Introduced in PHP 5.2.0.';
            break;
        default:
            $response = 'Unknown error';
            break;
    }

    if(!$valid){
        throw new Exception($response);
    }
}