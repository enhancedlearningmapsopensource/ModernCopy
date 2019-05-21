<?php
// Get common elements
define("ELM_ROOT", "../../../../../../../../../");
//echo realpath(ELM_ROOT);

// Connect to core functions
require_once(ELM_ROOT . "database/core.php");

// Authenticate the user
require_once(ELM_ROOT . "database/ajax.php");

try{
    $config = json_decode(Config(),true);
}catch(Exception $ex){
    // Log exception and continue
    echo "<script>console.warn(\"" . str_replace("\"", "'", $ex->getMessage()) ."\");console.warn(\"The config table will be loaded by hub so if it's missing reload page.\");</script>";
    $config = json_encode(array("error"=>TRUE));
}
?>

<html>
    <head>
        <title>Locater Tool Gateway</title>
        <script src="<?=ELM_ROOT?>external-lib/jquery/v3.2.1/jquery.min.js"></script>
        <form action="<?=$config["LOCATER_TOOL_PATH"]?>" method="post">
            <input type="hidden" name="email" value="<?=$_SESSION['ELM_EMAIL']?>">
            <input type="hidden" name="pass" value="<?=$_SESSION['ELM_PASS']?>">   
            <p>Loading locater tool. If the locater tool does not load within a few minutes, please click on the button below</p>
            <button>Load Locater Tool</button>
        </form>
    </head>
    <body>
        <p class="error"></p>
        <script>
            $(document).ready(function(){
                $("form").submit();
            });
        </script>
    </body>
</html>