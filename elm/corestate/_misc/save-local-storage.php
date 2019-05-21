<?php

require_once("../../ajax.php");
define("STORE_PATH", ELM_ROOT . "assets/preloaded-local-storage/");

$data = $_POST["data"];
$owner = $_POST["owner"];

// type into console to save local storage
//$.post("https://24.225.98.180/site/modernalpha/corestate/_misc/save-local-storage.php", {data: LZString.decompress(localStorage["elm-local-store"]), owner: localStorage["elm-local-owner"]}, function(ret){console.log(ret);});

file_put_contents(STORE_PATH . "preload.json", json_encode(array("data"=>$data, "owner"=>$owner)));


?>
