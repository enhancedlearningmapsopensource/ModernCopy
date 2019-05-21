<?php

//require_once('../ajax.php');

echo "<!-- css files -->";

$ignorePaths = array(
    ELM_PATH . "corestate/map/v1.0.0/",
    ELM_PATH . "corestate/map/v2.0.0/",
    ELM_PATH . "corestate/email/",
    ELM_PATH . "corestate/includes/nav/nav.css",
    ELM_PATH . "corestate/v3.0.0/css/",
    ELM_PATH . "corestate/menues-backbone/",
    ELM_PATH . "corestate/feedback/feedback.min.css",
    ELM_PATH . "corestate/feedback/feedback.css"
);

$bootstrap = ELM_ROOT . "external-lib/bootstrap/bootstrap-3.3.7/";
$bootstrapCss = $bootstrap . "css/bootstrap.min.css";
$extraPaths = array(
    ELM_PATH . "assets/iconsets/icomoon/style.css"
);

define("RESOURCE_MANAGER_PATH", ELM_PATH . "../modern_resourcemanager/resource-manager/");
define("CASCADE_PATH", ELM_ROOT . "cascade-plugin/");

$libraryPaths = array();
if(file_exists(RESOURCE_MANAGER_PATH)){
    array_push($libraryPaths, RESOURCE_MANAGER_PATH);
}
if(file_exists(CASCADE_PATH)){
    array_push($libraryPaths, CASCADE_PATH);
}
array_push($libraryPaths, ELM_PATH . "standards-page/");
array_push($libraryPaths, ELM_PATH . "navbar/");
array_push($libraryPaths, ELM_PATH . "map-legend/");
array_push($libraryPaths, ELM_PATH . "map-manager/");

function ScanForCss($path){
	$contents = scandir($path);
	$files = array();
	$folders = array();

	foreach($contents as $c){
		if(strcmp($c, ".") == 0 || strcmp($c,"..") == 0){
			continue;
		}

		$cS = $path . $c;
		if(!is_dir($cS)){
			$pParts = explode(".",$c);
			$pExt = $pParts[count($pParts) - 1];
			if(strcmp($pExt, "css") == 0){
				array_push($files, $cS);
			}
		}else{
			$pCssFiles = ScanForCss($cS . "/");
			foreach($pCssFiles as $f){
				array_push($files, $f);
			}
		}
	}
	return $files;
}

$files = ScanForCss(ELM_PATH . "corestate/");
foreach($libraryPaths as $l){
    $files = array_merge($files, ScanForCss($l));
}
foreach ($ignorePaths as $igMatch) {
    for ($findex = 0; $findex < count($files); $findex++) {
        $f = $files[$findex];
        $ignore = false;
        for ($i = 0; $i < strlen($f); $i++) {
            if ($i >= strlen($igMatch)) {
                $ignore = true;
                break;
            } else if (strcmp($f[$i], $igMatch[$i]) != 0) {
                $ignore = false;
                break;
            }
        }

        if ($ignore) {
            array_splice($files, $findex, 1);
            $findex--;
        }
    }
}

/*if(count($files) > 0){
	PreVarDump($files, "Files");
}*/

$outputAfter = -1;
$outputBefore = 34;
$numFiles = count($files);


$cssIgnore = array(' ', '\n', '\r', '\t');
$ordIgnore = array(13,10,9,239,187,191);

function cleanFile($cssFile){
    global $cssIgnore;
    global $ordIgnore;
    
    $content = file_get_contents($cssFile);
    $cleaned = "";
    for($i = 0; $i < strlen($content); $i++){
        $c = $content[$i];
        
        if($c >= 'a' && $c <= 'z'){
            $cleaned .= $c;
        }else if($c >= 'A' && $c <= 'Z'){
            $cleaned .= $c;
        }else if($c >= '0' && $c <= '9'){
            $cleaned .= $c;
        }else if($c == '{' || $c == '}' || $c == '.' || $c == '#' || $c == '/' || $c == '*' || $c == '-'){
            $cleaned .= $c;
        }else if($c == ':' || $c == ';' || $c == '!' || $c == '(' || $c == ',' || $c == '+' || $c == '@'){
            $cleaned .= $c;
        }else if($c == ')' || $c == '%' || $c == '>' || $c == '<' || $c == '"' || $c == ' ' || $c == '|'){
            $cleaned .= $c;
        }else if($c == '[' || $c == ']' || $c == '=' || $c == '^' || $c == '?'  || $c == '?' ){
            $cleaned .= $c;
        }else if($c == '~' || $c == '_' || ord($c) == 92 || ord($c) == 39){
            $cleaned .= $c;
        }else{
            if(!in_array($c, $cssIgnore) && !in_array(ord($c), $ordIgnore)){
                echo "\n\n/* UNKNOWN CHAR: '$c(".ord($c).")' */\n\n";
            }
        }
    }
    return $cleaned;
}

echo "<style>";
$bootstrapClean = cleanFile($bootstrapCss);
echo str_replace("../fonts/", $bootstrap . "fonts/", $bootstrapClean);

foreach($extraPaths as $i => $f){
    echo "\n/* File ($i/$numFiles): $f */\n";
    $clean = cleanFile($f);
    echo $clean;
}

foreach($files as $i => $f){
    echo "\n/* File ($i/$numFiles): $f */\n";
    $clean = cleanFile($f);
    echo $clean;
}
echo "</style>";
?>