<?php 
require_once("../database/core.php");
require_once(ELM_ROOT . "database/ajax.php");


$result = $database->PrototypeQuery("SELECT TEXTID FROM ELM_NODE");
//PreVarDump($result);

$subjects = array();

$all = array();
while($row = $database->fetch($result)){
    $textid = $row["TEXTID"];
    $pieces = explode("-", $textid);
    if(count($pieces) != 2){
        $pieces = explode("&#45;", $textid);
    }

    if(!isset($subjects[$pieces[0]])){
        $subjects[$pieces[0]] = array();
    }
    $subjects[$pieces[0]][] = intval($pieces[1]);

    $all[] = $row["TEXTID"];
}


$subjectIDs = array();
foreach($subjects as $k => $v){
    sort($subjects[$k]);
    $subjectIDs[$k] = array(
        "skipped"=>PHP_INT_MAX,
        "next"=>-PHP_INT_MAX 
    );

    // The minimum id is the first skipped as it will be the first avaliable after zero.
    // The maximum + 1 is the next avaliable.

    foreach($subjects[$k] as $s){
        $subjectIDs[$k]["skipped"] = min($subjectIDs[$k]["skipped"], $s);
        $subjectIDs[$k]["next"] = max($subjectIDs[$k]["next"], $s);
    }
    $subjectIDs[$k]["next"] = $subjectIDs[$k]["next"] + 1;
}

?>

<html>
<head>
<link rel="stylesheet" href="../../external-lib/bootstrap/bootstrap-3.3.7/css/bootstrap.min.css">
<title>Node ID Scanner</title>
<style>
</style>
</head>
<body>
<div class="container">

<div class="row">
<div class="col-xs-12 fixed-top-25">
<h3>Next Node IDs</h3>
<table class="table">
<tr>
<th>Subject</th>
<th>Skipped</th>
<th>Next</th>
</tr>
<?php foreach($subjectIDs as $k => $v){?>
<tr>
<td><?=$k ?></td>
<td><?=($v["skipped"] > 0) ? $k . "-" . $v["skipped"] : "n/a"?></td>
<td><?=$k . "-" . $v["next"]?></td>
</tr>
<?php } ?>
</table>
</div>
</div>

<div class="row">
<div class="col-xs-12 fixed-low-75">
<h3>All Nodes</h3>
<table class="table">
<?php foreach($all as $a){?>
<tr><td><?=$a?></td></tr>
<?php } ?>
</table>
</div>
</div>
</div>
</body>