<?php

throw new Exception("Deprecated 06/23/2018. Use version in database branch.");

// Communicator file on a live site
define("BASH_COMM_URL", "https://elmap.us/moderndevel/admin-main/managers/login-testing/login-bash.php");
define("PHP_DATA_URL", "https://elmap.us/moderndevel/admin-main/managers/login-testing/login-required.php");
define("PHP_REQUEST_SESSION_LOCAL", "https://24.124.86.108/Site/moderncopy/admin-main/managers/login-testing/request-session.php");

if(!file_exists("ELM_ROOT../modernbash/")){
    define("PHP_REQUEST_SESSION", "https://elmap.us/moderndevel/admin-main/managers/login-testing/request-session.php");
}else{
    define("PHP_REQUEST_SESSION", "ELM_ROOT../moderndevel/admin-main/managers/login-testing/request-session.php");
}

/**
 * Create a new user withs the given creds
 * @param {database} $database - query database
 * @param {string} $email - user email
 * @param {string} $password - user password
 * @return {array} - json object with resultant data
 */
function createUser($database, $email, $password, $state){
    $pUserResult    = $database->PrototypeQuery("SELECT U.USERID, P.SALT, P.ITERATIONS FROM ELM_USER AS U LEFT JOIN ELM_PASSWORD AS P ON U.USERID = P.USERID WHERE U.EMAIL LIKE ?", array(&$email));
    $pUserExists    = isset($pUserResult["result"]);
    if($pUserExists){
        throw new Exception("User already exists");
    }
    
    // Add the user
    $database->AddUser($email, "sdfADA*&qp1-28534&!^!Mcda_)", $state);
    
    // Get the user
    $pResult = $database->PrototypeQuery("SELECT U.USERID, P.SALT, P.ITERATIONS FROM ELM_USER AS U LEFT JOIN ELM_PASSWORD AS P ON U.USERID = P.USERID WHERE U.EMAIL LIKE ?", array(&$email));
    $pRow    = $database->FetchRowFromArray($pResult);
    
    $result = $database->GetGroupID("visitor");
    if(!isset($result["result"])){
        $pGroupID = $database->AddGroup("visitor");
    }else{
        $row = $database->FetchRowFromArray($result);
        $pGroupID = $row["GROUPID"];
    }
    
    $encryptedPassword = encryptPassword($database, $email, $password);
    $database->ChangePassword($email, $encryptedPassword);
    $database->AddUserToGroup($pRow["USERID"], $pGroupID);
}

function encryptPassword($database, $email, $password){
    $pResult = $database->PrototypeQuery("SELECT U.USERID, P.SALT, P.ITERATIONS FROM ELM_USER AS U LEFT JOIN ELM_PASSWORD AS P ON U.USERID = P.USERID WHERE U.EMAIL LIKE ?", array(&$email));
    $dbRow   = $database->FetchRowFromArray($pResult);
    
    // Set up encryption parameters
    $pOptions = array();
    $pOptions["salt"] = $dbRow["SALT"];
    $pOptions["userid"] = $dbRow["USERID"];
    $pOptions["iterations"] = $dbRow["ITERATIONS"];

    $pHasSalt = ($pOptions["salt"] != NULL);

    // Perform password encryption
    $crypt = new CryptPbkdf2();
    $pEncryptPass = NULL;
    if($password != null){
        // Encrypt the password using the given salt
        $pHash = $crypt->Encrypt($password, $pOptions);

        // If no salt provided for the user then add encryption parameters
        if($pOptions["salt"] == NULL){
            $database->AddEncryptionParameters($pOptions["userid"], $pHash["salt"], $pHash["iterations"]);
            $pOptions["salt"] = $pHash["salt"];
            $pOptions["iterations"] = $pHash["iterations"];
        }

        // Save the encrypted password
        $pEncryptPass = $pHash["hash"];
    }
    
    return $pEncryptPass;
}

/**
 * 
 * @param {string} $url - url to request from
 * @param {string[]} $params - parameters
 * @param {string[]} $params.post - parameters to post
 * @param {string[]} $params.sessionid - the session id to use as active
 * @return {curl}
 */
function simulateRequest($url, $params){
    $pCurl = curl_init();
    curl_setopt($pCurl, CURLOPT_RETURNTRANSFER, true);
    
    if(isset($params["sessionid"])){
        curl_setopt($pCurl, CURLOPT_COOKIE, "PHPSESSID=".$params["sessionid"]);
    }else{
        curl_setopt($pCurl, CURLOPT_COOKIE, "PHPSESSID=".session_id());
    }
    
    curl_setopt($pCurl, CURLOPT_URL,$url);
    curl_setopt($pCurl, CURLOPT_POST,true);
    curl_setopt($pCurl, CURLOPT_POSTFIELDS, http_build_query($params));
    curl_setopt($pCurl, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($pCurl, CURLOPT_SSL_VERIFYPEER, 0);
    
    // Get response
    $pResult = curl_exec($pCurl);
    
    // Get the error and response codes
    $pError = curl_error($pCurl);
    $pResponse = curl_getinfo($pCurl, CURLINFO_HTTP_CODE);

    // Close curl
    curl_close($pCurl);
    
    return array(
        "result"=>$pResult,
        "error"=>$pError,
        "response"=>$pResponse
    );
}

function simulateCall($url, $params){
    $pCurl = curl_init();
    curl_setopt($pCurl, CURLOPT_RETURNTRANSFER, true);
    
    curl_setopt($pCurl, CURLOPT_URL,$url);
    curl_setopt($pCurl, CURLOPT_POST,true);
    curl_setopt($pCurl, CURLOPT_POSTFIELDS, http_build_query($params));
    curl_setopt($pCurl, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($pCurl, CURLOPT_SSL_VERIFYPEER, 0);
    
    // Get response
    $pResult = curl_exec($pCurl);
    
    // Get the error and response codes
    $pError = curl_error($pCurl);
    $pResponse = curl_getinfo($pCurl, CURLINFO_HTTP_CODE);

    // Close curl
    curl_close($pCurl);
    
    return array(
        "result"=>$pResult,
        "error"=>$pError,
        "response"=>$pResponse
    );
}

function verifyLogin($database, $email, $password){ 
    $pOut = array();
    
    $phpVerify = json_decode(verifyPhpLogin($database, $email, $password), true);
    if(strcmp($phpVerify["status"], "SUCCESS") == 0){
        $pOut["phpverify"] = "TRUE";
    }else{
        $pOut["phpverify"] = "FALSE";
        $pOut["phperror"] = $phpVerify["error"];
    }
    
    $bashResponse = simulateRequest(BASH_COMM_URL, array("email"=>$email, "pass"=>$password));
    $bashVerify = json_decode($bashResponse["result"], TRUE);
    if(strcmp($bashVerify["status"], "SUCCESS") == 0){
        $pOut["bashverify"] = "TRUE";
        $pOut["bashsessionid"] = $bashVerify["sessionid"];
    }else{
        $pOut["bashverify"] = "FALSE";
        
    }
    $pOut["bashresponse"] = $bashResponse;
    
    return $pOut;
}


/**
 * Verify the given username and password
 * @param {database} $database - query database
 * @param {string} $email - user email
 * @param {string} $password - user password
 * @return {array} - json object with resultant data
 */
function verifyPhpLogin($database, $email, $password){    
    $pResult        = $database->PrototypeQuery("SELECT U.USERID, P.SALT, P.ITERATIONS FROM ELM_USER AS U LEFT JOIN ELM_PASSWORD AS P ON U.USERID = P.USERID WHERE U.EMAIL LIKE ?", array(&$email));
    $pUserExists    = isset($pResult["result"]);

    if($pUserExists){
        //$pRow = $database->FetchRowFromArray($pResult);
        $pEncryptPass = encryptPassword($database, $email, $password);
        if($pEncryptPass == NULL){
            return json_encode(array("status"=>"FAIL", "error"=>"INVALID ENCRYPTION"));
        }

        $isValidLogin = $database->IsValidHashedLogin($email, $pEncryptPass);
        if($isValidLogin){
            return json_encode(array("status"=>"SUCCESS"));
        }else{
            return json_encode(array("status"=>"FAIL", "error"=>"INVALID PASS"));
        }
    }else{
        return json_encode(array("status"=>"FAIL", "error"=>"INVALID EMAIL"));
    }
}

?>