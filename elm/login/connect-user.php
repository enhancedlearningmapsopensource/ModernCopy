<?php

/**
 * File contains function responsible for connecting a user to the system. It
 * should be included in the login file and its function called to determine
 * validity.
 */

/**
 * File containing general login functions such as encrypting passwords, 
 * and creating users.
 */
require_once(ELM_ROOT . "database/login/common-functions.php");

/**
 * 
 * @param type $database - database connection
 * @param {string} $email
 * @param {string} $pass - encrypted by js
 * @param {string[]} $log - log of actions
 * @param {boolean=true} $session - set session variables (use false for testing)
 * @returns {boolean} - true if php login successful, otherwise false
 * @throws Exception
 */
function connectUser($database, $email, $pass, &$log, $session = true){    
    $log = [];
    
    // Clear the session
    if($session){
        session_start();
        $_SESSION["ELM_EMAIL"] = "";
        $_SESSION["ELM_PASS"] = "";
        $_SESSION["ELM_BASH_ON"] = false;
        session_write_close();
        if(isset($_COOKIE["sessionid"])) {
            setcookie("sessionid", "", time() - 3600);
        }
    }
    
    $log[] = "try connect with ".$email;
    $verify = verifyLogin($database, $email, $pass);
    $verify["bashverify"] = "FALSE";
    
    
    if(strcmp($verify["bashverify"], "TRUE") == 0){
        $log[] ="login verified by bash.";
    }else{
        $log[] = "login not verified by bash.";
    }

    if(strcmp($verify["phpverify"], "TRUE") == 0){
        $log[] ="login verified by php.";
    }else{
        $log[] = "login not verified by php.";
        if(strcmp($verify["bashverify"], "TRUE") == 0){
            $log[] = "creating php user.";

            // Handle update user password
            if(strcmp($verify["phperror"], "INVALID PASS") == 0){
                $log[] = "user already exists. changing their password."; 
                $encryptedPass = encryptPassword($database, $email, $pass);
                $database->ChangePassword($email, $encryptedPass);
            }
            
            // Handle user does not exist in php
            else if(strcmp($verify["phperror"], "INVALID EMAIL") == 0){
                $log[] = "user does not exist in php. creating user.";
                createUser($database, $email, $pass, "ks");
            }

            // Handle user does not exist in php
            else{
                throw new Exception("unknown error");
            }


            $verify = verifyLogin($database, $email, $pass);
            if(strcmp($verify["phpverify"], "TRUE") == 0){
                $log[] = "user change accepted.";
            }
        }
    }

    if(strcmp($verify["phpverify"], "TRUE") == 0){
        $log[] = "accepting user credentials.";
        
        // Set php session
        if($session){
            session_name(MODERN_SESSION);
            session_start();
            $_SESSION["ELM_EMAIL"] = $email;
            $_SESSION["ELM_PASS"] = $pass;
            session_write_close();
            
            // Secure the cookie
            $log[] = "securing cookie.";
            setcookie(MODERN_SESSION, session_id(), time() + (86400 * 30), "/", "", true);
        
            // Allow old cookie to expire if it exists
            if(isset($_COOKIE["PHPSESSID"])) {
                setcookie("sessionid", "", time() - 3600);
            }
        }
        
        if(strcmp($verify["bashverify"], "TRUE") == 0){
            $log[] = "accepting bash and setting the bash sessionid.";
            if($session){
                // Set bash session
                setcookie("sessionid", $verify["bashsessionid"], time() + (86400 * 30), "/", "", true);
            
                // Make note of bash session
                session_start();
                $_SESSION["ELM_BASH_ON"] = true;
                session_write_close();
            }
        }else{
            $log[] = "no bash functionality allowed.";
        }
        return true;
    }else{
        $log[] = "rejecting user credentials.";
        return false;
    }
}
?>

