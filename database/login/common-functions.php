<?php

// Communicator file on a live site
define("BASH_COMM_URL", "https://elmap.us/moderndevel/admin-main/managers/login-testing/login-bash.php");
define("PHP_DATA_URL", "https://elmap.us/moderndevel/admin-main/managers/login-testing/login-required.php");
define("PHP_REQUEST_SESSION_LOCAL", "https://24.124.86.108/Site/moderncopy/admin-main/managers/login-testing/request-session.php");

if(!file_exists(ELM_ROOT . "../modernbash/")){
    define("PHP_REQUEST_SESSION", "https://elmap.us/moderndevel/admin-main/managers/login-testing/request-session.php");
}else{
    define("PHP_REQUEST_SESSION", ELM_ROOT ."../moderndevel/admin-main/managers/login-testing/request-session.php");
}

require_once(ELM_ROOT . "database/login/login.php");



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
    
    /*
    $bashResponse = simulateRequest(BASH_COMM_URL, array("email"=>$email, "pass"=>$password));
    $bashVerify = json_decode($bashResponse["result"], TRUE);
    if(strcmp($bashVerify["status"], "SUCCESS") == 0){
        $pOut["bashverify"] = "TRUE";
        $pOut["bashsessionid"] = $bashVerify["sessionid"];
    }else{
        $pOut["bashverify"] = "FALSE";
        
    }*/
    $pOut["bashverify"] = "TRUE";
    $pOut["bashsessionid"] = "notasessionid";
    //$pOut["bashresponse"] = $bashResponse;
    
    return $pOut;
}




?>