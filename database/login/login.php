<?php

/**
 * Create a new user withs the given creds
 * @param {database} $database - query database
 * @param {string} $email - user email
 * @param {string} $password - user password
 * @return {array} - json object with resultant data
 */
function createUser($database, $email, $password, $state){
    if($database->TableExists("ELM_PASSWORD")){
        $pUserResult    = $database->PrototypeQuery("SELECT U.USERID, P.SALT, P.ITERATIONS FROM ELM_USER AS U LEFT JOIN ELM_PASSWORD AS P ON U.USERID = P.USERID WHERE U.EMAIL LIKE ?", array(&$email));
        $pUserExists    = isset($pUserResult["result"]);
        if($pUserExists){
            throw new Exception("User already exists");
        }
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