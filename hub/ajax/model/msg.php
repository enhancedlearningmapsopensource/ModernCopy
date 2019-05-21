<?php

require_once("../utility/discussion-permissions.php");
require_once("base.php");

function GetAll(){
    global $database, $userID;
    
    $posts = getPermittedPosts();
    
    $userPosts = [];
    $lastMsgPosts = [];
    
    // Divide up posts
    foreach($posts as $p){
        if($p["creatorid"] == $userID){
            $userPosts[] = $p;
        }else{
            $lastMsgPosts[] = $p;
        }
    }
    
    // User posts
    if(count($userPosts) > 0){
        $userOrArr = array_map(function($d){
            return "POSTID=".$d["postid"];
        }, $userPosts);
        $userOrStr = implode(" OR ", $userOrArr);
        $userPostQuery = "SELECT * FROM ELM_DISCUSSION_POST_MSG WHERE ($userOrStr) ORDER BY DATECREATED ASC";
        $singles = getMsgs($userPostQuery);
    }else{
        $singles = [];
    }
    
    // Last message only posts
    if(count($lastMsgPosts) > 0){
        $orArr = array_map(function($d){
            return "POSTID=".$d["postid"];
        }, $lastMsgPosts);
        $orStr = implode(" OR ", $orArr);
        
        $lastMsgPostQuery = "SELECT * FROM ELM_DISCUSSION_POST_MSG WHERE ($orStr) ORDER BY DATECREATED ASC";
        
        $msgs = getMsgs($lastMsgPostQuery);
    }else{
        $msgs = [];
    }

    $groups = [];
    foreach($msgs as $m){
        if(!isset($groups[$m["postid"]])){
            $groups[$m["postid"]] = [$m];
        }else{
            $groups[$m["postid"]][] = $m;
        }
    }
    
    foreach($groups as $g){
        if(count($g) > 1){
            $singles[] = array_pop($g);
        }else if(count($g) == 1){
            $singles[] = $g[0];
        }
    }
    
    return $singles;
}

function GetMsgs($query, $arr = array()){
    global $database;
    $result = $database->PrototypeQuery($query);
    $msgs = array();
    while($row = $database->fetch($result)){
        $ob = array();
        foreach($row as $k => $v){
            $ob[strtolower($k)] = $v;
        }
        $ob["id"] = $ob["mid"];
        $msgs[] = $ob;
    }
    return $msgs;
}

function GetOne($id){
    global $database, $userID;
    
    $result = $database->PrototypeQuery("SELECT * FROM ELM_DISCUSSION_POST_MSG WHERE MID=?", array(&$id));
    
    $row = $database->fetch($result);    
    $ob = array();
    foreach($row as $k => $v){
        $ob[strtolower($k)] = $v;
    }
    $ob["id"] = $ob["mid"];
    return $ob;
}

function Post($data){
    global $database;
    
    $postid         = (isset($data["postid"]) ? $data["postid"] : "");
    $msg            = (isset($data["msg"]) ? $data["msg"] : "");
    $date           = date("Y-m-d H:i:s");
    
    // Get the current data
    $id = $database->PrototypeInsert("INSERT INTO ELM_DISCUSSION_POST_MSG(POSTID,MSG,D,DATECREATED) VALUES (?,?,?,?)", 
            array(
                &$postid,       // POSTID
                &$msg,          // MSG
                &$date,         // D
                &$date          // DATECREATED
                ));
    
    return GetOne($id);
}

?>