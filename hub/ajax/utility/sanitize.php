<?php
/**
 * Sanitize the given string by removing all unnecessary characters.
 * 
 * Keep:
 * Alphanumeric, 
 * ';', '&', '#' - to allow for html entities
 * 
 * @param {string} $str - the string to sanitize
 * @return {string} - the sanitized string
 */
function Sanitize($str){
    // Break string into characters
    $charArr = str_split($str);
    
    // Map unaccepted characters
    $accepted = array_map(function($d){
        $ascii = ord($d);
        
        // Check a-zA-Z0-9
        if(IsAlphanumeric($d) || IsAcceptedSpecial($d)){
            return $d;
        }else{
            $conv = null;
            if(IsRecognized($d, $conv)){
                return $conv;
            }else{
                if(ord($d) != 8){
                    return "[failed to sanitize: '$d'($ascii)]";
                }
            }
        }
    }, $charArr);
    
    // Reassemble string
    $reassemble = implode("", $accepted);
    return $reassemble;
}

/**
 * Checks to see if the given character is alphanumeric.
 * @param {char} $char - char to check
 * @return {bool} - true if the character is alphanumeric, otherwise false
 */
function IsAlphanumeric($char){
    $ascii = ord($char);
    
    // Check a-zA-Z
    if(($ascii >= ord("a") && $ascii <= ord("z")) || ($ascii >= ord("A") && $ascii <= ord("Z"))){
        return true;
    }

    // Check 0-9
    else if($ascii >= ord("0") && $ascii <= ord("9")){
        return true;
    }
    
    return false;
}

/**
 * Checks to see if the given character is one of the accepted special characters.
 * @param {char} $char - char to check
 * @return {bool} - true if the character is one of the accepted special characters, otherwise false
 */
function IsAcceptedSpecial($char){
    $ascii = ord($char);
    switch($ascii){
        case ord(";"):
        case ord("#"):
        case ord("&"):
        case 0:
            return true;
        default:
            return false;
    }
}

/**
 * Checks to see if the given character is recognized and can be converted to an html entity.
 * @param {char} $char - char to check
 * @param {string} $conv - the converted character
 * @return {bool} - true if the character is recognized and can be converted to an html entity, otherwise false
 */
function IsRecognized($char, &$conv){
    $ascii = ord($char);
    switch($ascii){
        case ord("\n"):
            $conv = "&#32;";
            return true;
        case ord(" "):
            $conv = "&#32;";
            return true;
        case ord("!"):
            $conv = "&#33;";
            return true;
        case ord("\""):
            $conv = "&#34;";
            return true; 
        case ord("$"):
            $conv = "&#36;";
            return true;
        case ord("%"):
            $conv = "&#37;";
            return true;    
        case ord("'"):
            $conv = "&#39;";
            return true;
        case ord("("):
            $conv = "&#40;";
            return true;
        case ord(")"):
            $conv = "&#41;";
            return true;
        case ord("*"):
            $conv = "&#42;";
            return true;
        case ord("+"):
            $conv = "&#43;";
            return true;
        case ord(","):
            $conv = "&#44;";
            return true;
        case ord("-"):
            $conv = "&#45;";
            return true;
        case ord("."):
            $conv = "&#46;";
            return true;
        case ord("/"):
            $conv = "&#47;";
            return true;
        case ord(":"):
            $conv = "&#58;";
            return true;
        case ord("<"):
            $conv = "&#60;";
            return true;
        case ord("="):
            $conv = "&#61;";
            return true;
        case ord(">"):
            $conv = "&#62;";
            return true;
        case ord("?"):
            $conv = "&#63;";
            return true;
        case ord("@"):
            $conv = "&#64;";
            return true;
        case ord("["):
            $conv = "&#91;";
            return true;
        case ord("\\"):
            $conv = "&#92;";
            return true;
        case ord("]"):
            $conv = "&#93;";
            return true;
        case ord("_"):
            $conv = "&#95;";
            return true;
        case ord("{"):
            $conv = "&#123;";
            return true;
        case ord("|"):
            $conv = "&#124;";
            return true;
        case ord("}"):
            $conv = "&#125;";
            return true;
        case 128:
        case 153:
        case 226:
            $conv = "";
            return true;
        default: 
            return false;
    }
}

function Unsanitize($str){
    // Break string into characters
    $charArr = str_split($str);
    
    // Find html characters
    $ready = "";
    $reserve = "";
    $i = 0;
        
    while($i < count($charArr)){
        $c = $charArr[$i];
        switch($c){
            case "&":
                $ready .= $reserve;
                $reserve = $c;
                break;
            case "#":
                $reserve .= $c;
                break;
            case ";":
                $reserve .= $c;
                if(strcmp(substr($reserve,0,2), "&#") == 0){
                    $ready .= UnsanitizeCharacter($reserve);
                }else{
                    $ready .= $reserve;
                }
                $reserve = "";
                break;
            default:
                $reserve .= $c;
        }
        
        $i++;
    }
    $ready .= $reserve;
    return $ready;
}

function UnsanitizeCharacter($char){
    $pre = substr($char, 0, 2);
    if(strcmp($pre, "&#") != 0){
        throw new Exception("Invalid char: [$char]");
    }
    $post = substr($char, strlen($char) - 1, 1);
    if(strcmp($post, ";") != 0){
        throw new Exception("Invalid char: [$char]. Post: [$post]");
    }
    
    $num = intval(substr($char, 2, -1));
    $r = null;
    switch($num){
        case 32: $r = " "; break;
        case 33: $r = "!"; break;
        case 34: $r = "\""; break;
        case 36: $r = "$"; break;
        case 37: $r = "%"; break;
        case 39: $r = "'"; break;
        case 40: $r = "("; break;
        case 41: $r = ")"; break;
        case 42: $r = "*"; break;
        case 43: $r = "+"; break;
        case 44: $r = ","; break;
        case 45: $r = "-"; break;
        case 46: $r = "."; break;
        case 47: $r = "/"; break;
        case 58: $r = ":"; break;
        case 60: $r = "<"; break;
        case 61: $r = "="; break;
        case 62: $r = ">"; break;
        case 63: $r = "?"; break;
        case 64: $r = "@"; break;
        case 91: $r = "["; break;
        case 92: $r = "\\"; break;
        case 93: $r = "]"; break;
        case 95: $r = "_"; break;
        case 123: $r = "{"; break;
        case 124: $r = "|"; break;
        case 125: $r = "}"; break;
        default:
            throw new Exception("Invalid char: [$char]. Unknown symbol: &#[$num];");
    }
    
    return $r;
}
?>