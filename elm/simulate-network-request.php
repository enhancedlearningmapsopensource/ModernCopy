<?php

require_once("core.php");

session_start();
$_SESSION['ELM_EMAIL'] 	= "elmmaster@ku.edu";
$_SESSION['ELM_PASS'] 	= md5("elmmasterpass");
session_write_close();


function formatBytes($bytes, $precision = 2) { 
    $units = array('B', 'KB', 'MB', 'GB', 'TB'); 

    $bytes = max($bytes, 0); 
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024)); 
    $pow = min($pow, count($units) - 1); 

    // Uncomment one of the following alternatives
    // $bytes /= pow(1024, $pow);
    // $bytes /= (1 << (10 * $pow)); 

    return round($bytes, $precision) . ' ' . $units[$pow]; 
} 

function simulateRequest($url, $params){
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_COOKIE, "PHPSESSID=".session_id());
    curl_setopt($curl,CURLOPT_URL,$url);
    curl_setopt($curl,CURLOPT_POST,true);
    curl_setopt($curl,CURLOPT_POSTFIELDS,http_build_query($params));
    curl_setopt($curl,CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($curl,CURLOPT_SSL_VERIFYPEER, 0);

    return $curl;
}

$include = "content_type,header_size,request_size,total_time,size_download,speed_download,download_content_length";
$params = array(
    "type" => "GET",
    "qty" => "ALL"
);
$baseURL = "https://24.124.86.108/Site/moderncopy/backbone/ajax/";
$files = array(
    "subgraph",
    "node",
    "standard",
    "resource",
    "user",
    "preference",
    "usermap",
    "subject",
    "domain",
    "standard-set",
    "grade-level",
    "naming-rule",
    "discussion"
);

/*$requestInfo = array();
foreach($files as $f){
    $requestInfo[$f] = simulateRequest($baseURL.$f.".php", $params, $include)["info"];
}*/

$curlHandles = array();
$curlMulti = curl_multi_init();
foreach($files as $f){
    $curl = simulateRequest($baseURL.$f.".php", $params, $include);
    $curlHandles[] = array("curl" => $curl, "file" => $f);
    curl_multi_add_handle($curlMulti, $curl);
}

$active = null;
$results = [];

// Execute the handles
do {
    $mrc = curl_multi_exec($curlMulti, $active);
    $results[] = $mrc;
} while ($mrc == CURLM_CALL_MULTI_PERFORM);

while ($active && $mrc == CURLM_OK) {
    if (curl_multi_select($curlMulti) != -1) {
        do {
            $mrc = curl_multi_exec($curlMulti, $active);
            $results[] = $mrc;
        } while ($mrc == CURLM_CALL_MULTI_PERFORM);
    }
}

PreVarDump(curl_multi_info_read($curlMulti));
PreVarDump($results);


// Close the handles
foreach($curlHandles as $k => $c){
    $curl = $c["curl"];

    $info = curl_getinfo($curl);
    $inc = explode(",", $include);
    $filteredInfo = array();
    for($i = 0; $i < count($inc); $i++){
        $filteredInfo[$inc[$i]] = $info[$inc[$i]];
    }

    $curlHandles[$k]["info"] = $filteredInfo;


    //return array("info" => $filteredInfo);

    //PreVarDump(curl_getinfo($c["curl"]));
    curl_multi_remove_handle($curlMulti, $curl);
    curl_close($curl);
}

//PreVarDump($curlHandles);

curl_multi_close($curlMulti);

//return;

$requestInfo = array();
foreach($curlHandles as $c){
    $file = $c["file"];
    $info = $c["info"];
    $requestInfo[$file] = $info;
}

?><table>
    <tr><th></th><?php
        foreach($requestInfo as $k => $r){
            ?><th><?=$k;?></th><?php
        }
    ?></tr><?php
    
    

$fields = explode(",",$include);
foreach($fields as $l){
    ?><tr><?php
    ?><th><?=$l?></th><?php
    foreach($requestInfo as $r){
        ?><td><?=$r[$l];?></td><?php
    }
    ?><tr><?php
}
?></table><?php
PreVarDump($requestInfo);

/*$curl = curl_init();
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
$params = array(
    "type" => "GET",
    "qty" => "ALL"
);
curl_setopt($curl, CURLOPT_COOKIE, "PHPSESSID=".session_id());
curl_setopt($curl,CURLOPT_URL,"https://24.124.86.108/Site/moderncopy/backbone/ajax/subgraph.php");
curl_setopt($curl,CURLOPT_POST,true);
curl_setopt($curl,CURLOPT_POSTFIELDS,http_build_query($params));
curl_setopt($curl,CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl,CURLOPT_SSL_VERIFYPEER, 0);

$result = curl_exec($curl);
$info = curl_getinfo($curl);*/



//curl_close($curl);



////PreVarDump($filteredInfo);
//PreVarDump($info);



?>