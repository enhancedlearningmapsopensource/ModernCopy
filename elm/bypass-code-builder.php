<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

require_once("ajax.php");

// Get the user info
$result = $database->GetBasicUserInfo($userID);
$user = $database->FetchRowFromArray($result);
$adminGroupID = $database->GetGroupID("admin")["result"][0]["GROUPID"];


if(intval($user["GROUPID"]) != intval($adminGroupID)){
    exit(0);
}
    
PreVarDump($user);

// Get all users
$result = $database->PrototypeQuery("SELECT * FROM ELM_USER");
$row = $database->fetch($result);
PreVarDump($row);
if(isset($row["BYPASS_KEY"])){
    $database->PrototypeQueryQuiet("ALTER TABLE ELM_USER DROP COLUMN BYPASS_KEY", array());
}

$database->PrototypeQueryQuiet("ALTER TABLE ELM_USER ADD BYPASS_KEY VARCHAR(256)", array());
$database->PrototypeQueryQuiet("UPDATE ELM_USER SET BYPASS_KEY='n/a'", array());

// Get all users
$result = $database->PrototypeQuery("SELECT * FROM ELM_USER");

define("BYPASS_CODE", "elmuseremulationpasselm");
?>

<script src="<?= ELM_ROOT ?>3rdParty/jquery/v3.2.2/-effects/jquery.min.js"></script>
<script src= "<?= ELM_ROOT ?>crypt/javascript-encrypt.js"></script>
<script>
function submit(options){
    $.post('<?=ELM_ROOT?>submit-bypass-code.php',options,function(ret){
        $("#out").append(ret);
    });
}
    
function convert(email, password){
    var options = {};          
    options.email = email;
    options.remember = false;

    tryPBKDF2(options.email, password).then(function (hashed) {
        options.pass = hashed;
        submit(options);
    }).catch(function (err) {
        $("#out").append(err);
    });
}
<?php while($row = $database->fetch($result)){ ?>
    <?= "convert('" . $row["EMAIL"] . "','" . BYPASS_CODE . "');" ?>
<?php } ?>
</script>

<div id="out"></div>
