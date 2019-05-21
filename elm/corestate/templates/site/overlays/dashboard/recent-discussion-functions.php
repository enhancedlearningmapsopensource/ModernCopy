<?php if(!defined("ELM_ROOT")){ 
    require_once("../../../../../ajax.php"); 
} 

/**
 * Get recent discussion posts
 * @param {int} maxChars - the max number of characters of the post to show
 * @param {int} maxPosts - the max number of posts to show
 */
// Removed 12/13/2018
// function getRecentDiscussionsOld($maxChars, $maxPosts){
//     global $database;
//     global $user;

//     echo "<table class='table dashboard-table'>";

//     $numPosts = 0;
//     $representedMaps = array();

//     $result = $database->GetPostsByDate();
//     while($row = $database->FetchRowFromArray($result)){
//         $mapID = trim($row["MAP"]);
//         if(strlen($mapID)  == 0){
//             continue;
//         }

//         if(!isset($representedMaps[$mapID])){
//             $representedMaps[$mapID] = 1;
//             addRow($mapID, strip_tags($row["MSG"]), $maxChars, $row["POSTDATE"]);      

//             $numPosts++;
//             if($numPosts >= $maxPosts){
//                 break;
//             }
//         }
//     }
//     echo "</table>";
// }

function getRecentDiscussions($maxChars, $maxPosts){
    global $database;

    echo "<table class='table dashboard-table'>";
    
    $result = $database->ProtoTypeQuery("SELECT A.DID, M.MSG, M.MID, M.DATECREATED, D.OBID, MAPS.TITLE FROM ELM_DISCUSSION_POST AS P, "
            . "(SELECT DID FROM ELM_DISCUSSION_POST GROUP BY DID) AS A,"
            . "ELM_DISCUSSION_POST_MSG AS M, "
            . "ELM_DISCUSSION AS D,"
            . "ELM_MAP AS MAPS "
            . "WHERE A.DID = P.DID AND "
            . "M.POSTID = P.POSTID AND "
            . "P.DATEDELETED IS NULL AND "
            . "MAPS.MAPID = D.OBID AND "
            . "D.DID = A.DID AND "
            . "MAPS.ISPUBLIC = 1 "
            . "ORDER BY M.DATECREATED DESC", array());
    
    //PreVarDump($result);
    
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
    
    $cnt = 0;
    foreach($formatedDiscussions as $f){
        if($cnt > $maxPosts){
            break;
        }
        $cnt++;
        addRow($f["MAPID"], strip_tags($f["MSG"]), $maxChars, $f["DATE"]);
    }
    echo "</table>";
}

function getRecentExpanded($maxChars, $maxPosts, $database, $userID){
    // Get all maps avaliable to the user
    $mapIDs = getAvaliableMaps($database, $userID);
    // Get all nodes avaliable to the user
    $nodeIDs = getAvaliableNodes($database, $userID);
    // Get all resources avaliable to the user
    $resIDs = removeDuplicatesIntArray(getAvaliableResources($database, $mapIDs));
    
    // Get discussions associated with maps
    $mapDiscussionIDs = getDiscussionsForMaps($database, $mapIDs);
    $nodeDiscussionIDs = getDiscussionsForNodes($database, $nodeIDs);
    $resDiscussionIDs = getDiscussionsForResources($database, $nodeIDs);
    
    $mergedDiscussionIDs = array_merge($mapDiscussionIDs,$nodeDiscussionIDs,$resDiscussionIDs);
    $discussionIDs = removeDuplicatesIntArray($mergedDiscussionIDs);
    
    // Get discussion posts
    $postIDs = getDiscussionPosts($database, $discussionIDs);
    
    // Get messages
    $msgIDs = getDiscussionMessages($database, $postIDs);
    
    // Gather message information
    $msgs = getMessageInfo($database, $msgIDs);
   
    // Record which obtype-obid pairs have been shown
    $shown = array();
    
    echo "<table class='table dashboard-table'>";
    while($m = $database->fetch($msgs)){
        $obPair = $m["OBTYPE"] . "-" . $m["OBID"];
        if(!in_array($obPair, $shown)){
            $shown[] = $obPair;
        }else{
            continue;
        }
        
        echo "<tr>";
        
        if(strcmp($m["OBTYPE"],"map") == 0){
            $result = $database->PrototypeQuery("SELECT TITLE FROM ELM_MAP WHERE MAPID=?", array(&$m["OBID"]));
            $row = $database->fetch($result);
            echo "<td><a href='#' class='dashboard-link'>".$row["TITLE"]."</a></td>";
        }else if(strcmp($m["OBTYPE"],"node") == 0){
            echo "<td>Node</td>";
        }else if(strcmp($m["OBTYPE"],"resource") == 0){
            echo "<td>Resource</td>";
        }
        
        
        
        $msg = strip_tags(strip_tags(htmlspecialchars_decode($m["MSG"])));
        if(strlen($msg) > $maxChars){
            $msg = substr($msg, 0, $maxChars) . "...";
        }

        $date = $m["DATECREATED"];
        echo "<td class='msg'>" . $msg . "</td>";
        echo "<td style='width:100%'><strong>Last Post:</strong> " . $date . "</td>";
        echo "</tr>";
    }
    echo "</table>";
}

/**
 * Get the IDs of all maps that are visible (accessible) to the user.
 * @param type $database
 * @param type $userID
 * @return {int[]}
 */
function getAvaliableMaps($database, $userID){
    // Get all maps that:
    // a) Belong to the current user
    // b) Belong to an admin user and are public
    
    $result = $database->ProtoTypeQuery(""
            . "SELECT M.TITLE,M.MAPID,M.CREATORID,M.ISPUBLIC,GR.NAME FROM "
            . "ELM_MAP AS M "
            . "LEFT JOIN ELM_USERGROUP AS G ON M.CREATORID=G.USERID "
            . "LEFT JOIN ELM_GROUP AS GR ON G.GROUPID=GR.GROUPID "
            . "WHERE (GR.NAME LIKE 'admin' AND M.ISPUBLIC=1) OR (M.CREATORID=?)", array($userID));
   
    $ids = array();
    while($row = $database->fetch($result)){
        $ids[] = intval($row["MAPID"]);
    }
    return $ids;
}

/**
 * Get the IDs of all maps that are visible (accessible) to the user.
 * @param type $database
 * @param type $userID
 * @return {int[]}
 */
function getAvaliableNodes($database, $userID){
    $result = $database->ProtoTypeQuery("SELECT NODEID FROM ELM_NODE");
   
    $ids = array();
    while($row = $database->fetch($result)){
        $ids[] = intval($row["NODEID"]);
    }
    return $ids;
}

/**
 * Get the IDs of all resources that are visible (accessible) to the user.
 * @param type $database
 * @param type $userID
 * @return {int[]}
 */
function getAvaliableResources($database, $mapIDs){
    $mapIDStr = array_map(function($d){
        return "MAPID=$d";
    }, $mapIDs);
    $orStr = implode(" OR ", $mapIDStr);
    
    $result = $database->ProtoTypeQuery("SELECT RESOURCEID FROM ELM_MAPRESOURCE WHERE ($orStr)");
   
    $ids = array();
    while($row = $database->fetch($result)){
        $ids[] = intval($row["RESOURCEID"]);
    }
    return $ids;
}


function getObOrStr($ids){
     $obIDs = array_map(function($d){
        return "OBID=$d";
    }, $ids);
    if(count($obIDs) > 0){
        return "AND (" . implode(" OR ", $obIDs) . ")";
    }else{
        return "";
    }
    
}

function getDiscussionsFor($database, $ids, $type){
    $orStr = getObOrStr($ids);
    $result = $database->ProtoTypeQuery("SELECT DID FROM ELM_DISCUSSION WHERE OBTYPE LIKE '$type' $orStr");
    $out = array();
    while($row = $database->fetch($result)){
        $out[] = intval($row["DID"]);
    }
    return $out;
}   

/**
 * Get ids for discussions about the given map ids
 * @param type $database
 * @param type $userID
 * @return {int[]}
 */
function getDiscussionsForMaps($database, $ids){   
    return getDiscussionsFor($database, $ids, "map");
}

/**
 * Get ids for discussions about the given node ids
 * @param type $database
 * @param type $userID
 * @return {int[]}
 */
function getDiscussionsForNodes($database, $ids){   
    return getDiscussionsFor($database, $ids, "node");
}

/**
 * Get ids for discussions about the given resource ids
 * @param type $database
 * @param type $userID
 * @return {int[]}
 */
function getDiscussionsForResources($database, $ids){   
    return getDiscussionsFor($database, $ids, "resource");
}

/**
 * Remove duplicates from the int array
 * @param {int[]} arr - array to clean
 * @return {int[]} - cleaned array
 */
function removeDuplicatesIntArray($arr){
    $copy = array();
    foreach($arr as $a){
        $copy[] = $a;
    }
    
    sort($copy, SORT_NUMERIC);
    //return $copy;
    $clean = array();
    for($i = 0; $i < count($copy) - 1; $i++){
        if($copy[$i] != $copy[$i + 1]){
            $clean[] = $copy[$i];
        }
    }
    unset($copy);
    return $clean;
}

function getDiscussionPosts($database, $discussionIDs){
    $dids = array_map(function($d){
        return "DID=$d";
    }, $discussionIDs);
    $orStr = implode(" OR ", $dids);
    $result = $database->PrototypeQuery("SELECT POSTID FROM ELM_DISCUSSION_POST WHERE ($orStr) AND (DATEDELETED LIKE '" . TIME_ZERO . "' OR DATEDELETED LIKE '0000-00-00 00:00:00')");
    
    $out = array();
    while($row = $database->fetch($result)){
        $out[] = intval($row["POSTID"]);
    }
    return $out;
}

function getDiscussionMessages($database, $postIDs){
    if(count($postIDs) > 0){
        $pids = array_map(function($d){
            return "POSTID=$d";
        }, $postIDs);
        $orStr = "WHERE (".implode(" OR ", $pids).")";
    }else{
        $orStr = "";
    }
    
    $result = $database->PrototypeQuery("SELECT MID FROM ELM_DISCUSSION_POST_MSG $orStr ORDER BY DATECREATED DESC");
    $out = array();
    while($row = $database->fetch($result)){
        $out[] = intval($row["MID"]);
    }
    return $out;
}

function getMessageInfo($database, $msgIDs){
    $mids = array_map(function($d){
        return "M.MID=$d";
    }, $msgIDs);
    $orStr = implode(" OR ", $mids);
    $result = $database->PrototypeQuery(
            "SELECT M.MID, M.DATECREATED, M.MSG, D.DID, P.POSTID, D.OBTYPE, D.OBID
             FROM 
                ELM_DISCUSSION_POST_MSG AS M 
                LEFT JOIN ELM_DISCUSSION_POST AS P ON M.POSTID=P.POSTID
                LEFT JOIN ELM_DISCUSSION AS D ON P.DID=D.DID
             WHERE ($orStr) ORDER BY M.DATECREATED DESC");
    return $result;
}