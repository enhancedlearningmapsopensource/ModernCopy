<?php
/**
 * Get the discussions that are viewable by the current user.
 * @global type $database - the database
 * @global {number} $userID - the user id
 * @param {number} $id - the id of the single discussion to fetch.
 */
function getPermittedDiscussions($id = NULL){
    $idStr = ($id != NULL) ? " AND DID=$id" : "";
    
    if(IsSuperAdmin()){
        $query = "SELECT * FROM ELM_DISCUSSION WHERE (DATEDELETED LIKE '".TIME_ZERO."' OR DATEDELETED LIKE '0000-00-00 00:00:00' OR DATEDELETED IS NULL)$idStr";
        return gatherDiscussions($query);
    }
    
    $nodeDiscussions = getNodeDiscussions($idStr);
    $mapDiscussions = getPermittedMapDiscussions($idStr);
    $resDiscussions = getPermittedResourceDiscussions($idStr);
    return mergeDiscussionLists(array($nodeDiscussions, $mapDiscussions, $resDiscussions));    
}

function getPermittedPosts($id = NULL){
    global $database;
    
    $discussions = getPermittedDiscussions();
    $orArr = array_map(function($d){
        return "DID=".$d["did"];
    }, $discussions);
    $orStr = implode(" OR ", $orArr);
    
    $all = array();
    if(count($discussions) > 0){
        $result = $database->PrototypeQuery("SELECT * FROM ELM_DISCUSSION_POST WHERE ($orStr) AND (DATEDELETED LIKE '".TIME_ZERO."' OR DATEDELETED LIKE '0000-00-00 00:00:00' OR DATEDELETED IS NULL)");
        while($row = $database->fetch($result)){
            $ob = array();
            foreach($row as $k => $v){
                $ob[strtolower($k)] = $v;
            }
            $ob["id"] = $ob["postid"];
            $all[] = $ob;
        }
    }
    
    return $all;  
}

function getNodeDiscussions($idStr){
    $nodeQuery = "SELECT * FROM ELM_DISCUSSION WHERE (DATEDELETED LIKE '".TIME_ZERO."' OR DATEDELETED LIKE '0000-00-00 00:00:00' OR DATEDELETED IS NULL) AND OBTYPE LIKE 'node'$idStr";
    return gatherDiscussions($nodeQuery);
}

function getPermittedMapDiscussions($idStr){
    global $userID;
    $mapQuery = "SELECT * FROM ELM_DISCUSSION AS D 
                    LEFT JOIN ELM_MAP AS M ON D.OBID=M.MAPID 
                    WHERE 
                        (D.DATEDELETED LIKE '".TIME_ZERO."' OR D.DATEDELETED LIKE '0000-00-00 00:00:00' OR D.DATEDELETED IS NULL)  
                        AND D.OBTYPE LIKE 'map' 
                        AND (M.ISPUBLIC=1 OR M.CREATORID=?)$idStr";
    return gatherDiscussions($mapQuery, array(&$userID));
}

function getPermittedResourceDiscussions($idStr){
    global $userID;
    $resQuery = "SELECT * FROM ELM_DISCUSSION AS D 
                    LEFT JOIN ELM_RESOURCE AS R ON D.OBID=R.RESOURCEID 
                    LEFT JOIN ELM_MAPRESOURCE AS MR ON MR.RESOURCEID=R.RESOURCEID
                    LEFT JOIN ELM_MAP AS M ON M.MAPID=MR.MAPID
                    WHERE 
                        (D.DATEDELETED LIKE '".TIME_ZERO."' OR D.DATEDELETED LIKE '0000-00-00 00:00:00' OR D.DATEDELETED IS NULL)  
                        AND D.OBTYPE LIKE 'resource' 
                        AND (R.ISPUBLIC=1 OR R.CREATORID=? OR M.ISPUBLIC=1)$idStr";
    return gatherDiscussions($resQuery, array(&$userID));
}

function gatherDiscussions($query, $arr = array()){
    global $database;
    $result = $database->PrototypeQuery($query, $arr);
    $all = array();
    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["did"];
        $all[] = $ob;
    }
    return $all;
}

function mergeDiscussionLists($lst){
    $discussions = [];
    for($i = 0; $i < count($lst); $i++){
        foreach($lst[$i] as $d){
            if(!isset($discussions[$d["id"]])){
                $discussions[$d["id"]] = $d;
            }
        }
    }
    
    /*foreach($mapDiscussions as $d){
        if(!isset($discussions[$d["id"]])){
            $discussions[$d["id"]] = $d;
        }
    }
    foreach($resDiscussions as $d){
        if(!isset($discussions[$d["id"]])){
            $discussions[$d["id"]] = $d;
        }
    }*/
    
    $unordered = [];
    foreach($discussions as $k => $v){
        $unordered[] = $v;
    }
    return $unordered;
}

?>