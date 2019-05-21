<?php if(!defined("ELM_ROOT")){ 
    require_once("../../../../../../database/core.php"); 
    require_once(ELM_ROOT . "database/ajax.php"); 
} 

require_once(ELM_ROOT . "elm/corestate/templates/site/overlays/dashboard/recent-discussion-functions.php"); ?>
<?php ob_start(); // Start recording the html ?>

<?php 

$MAX_CHARS = 20;
$MAX_RECENT = 4;

function addRow($mapID, $msg, $maxChars, $date){
    echo "<tr>";
    echo "<td><a href='#' class='dashboard-link'>$mapID</a></td>";

    if(strlen($msg) > $maxChars){
        $msg = substr($msg, 0, $maxChars) . "...";
    }

    echo "<td class='msg'>" . $msg . "</td>";
    echo "<td style='width:100%'><strong>Last Post:</strong> " . $date . "</td>";
    echo "</tr>";
}

/**
 * Get user discussion posts
 * @param {int} maxChars - the max number of characters of the post to show
 * @param {int} maxPosts - the max number of posts to show
 */
function getUserDiscussions($maxChars, $userID){
    global $database;

    echo "<table class='table dashboard-table'>";
    
    $result = $database->ProtoTypeQuery("SELECT A.DID, M.MSG, M.MID, M.DATECREATED, D.OBID, MAPS.TITLE FROM ELM_DISCUSSION_POST AS P, "
            . "(SELECT DID FROM ELM_DISCUSSION_POST WHERE CREATORID = ? GROUP BY DID) AS A,"
            . "ELM_DISCUSSION_POST_MSG AS M, "
            . "ELM_DISCUSSION AS D,"
            . "ELM_MAP AS MAPS "
            . "WHERE A.DID = P.DID AND "
            . "M.POSTID = P.POSTID AND "
            . "P.DATEDELETED IS NULL AND "
            . "MAPS.MAPID = D.OBID AND "
            . "D.DID = A.DID "
            . "ORDER BY M.DATECREATED DESC", array(&$userID));
    
    $discussions = [];
    while($row = $database->fetch($result)){
        $lastDiscussion = (count($discussions) > 0) ? $discussions[count($discussions) - 1] : NULL;
        if($row["DID"] == $lastDiscussion["DID"]){
            continue;
        }else{
            $discussions[] = $row;
        }
    }
    
    // Filter discussion data
    $formatedDiscussions = array_map(function($d){
        return array("MAPID" => $d["TITLE"],
            "DATE"=> $d["DATECREATED"],
            "MSG"=> strip_tags(htmlspecialchars_decode($d["MSG"])));//implode("--", str_split($d["MSG"])));
    }, $discussions);
    
    foreach($formatedDiscussions as $f){
        addRow($f["MAPID"], strip_tags($f["MSG"]), $maxChars, $f["DATE"]);
    }
    
    
    echo "</table>";
}



?>

<?php // TITLE SECTION ?>
Dashboard
<?php $title = ob_get_contents(); ob_end_clean();// Gather the html ?>


<?php // CONTENT SECTION ?>
<?php ob_start(); // Start recording the html ?>
<div class="row">
    <div class="col-xs-12 col-sm-12 col-lg-12"> 
        <h4>Recent Discussion Updates</h4>
        <div class="recent-discussions"></div>

        <h4>Your Discussions</h4>
        <div class="your-discussions"></div>
    </div>
    
</div>
<?php $content = ob_get_contents(); ob_end_clean();// Stop recording the html ?>

<?php // FOOTER SECTION ?>
<?php ob_start(); // Start recording the html ?>
<h4>Click to close</h4>
<?php $footer = ob_get_contents(); ob_end_clean();// Gather the html ?>

<?php // OUTPUT TO PAGE ?>
<?php require_once(ELM_ROOT . "elm/corestate/templates/site/overlays/layout/layout.php"); ?>
<?php overlay($title, $content, $footer); ?>