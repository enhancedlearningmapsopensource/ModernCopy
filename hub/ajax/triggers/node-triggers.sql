USE `elm_release`;
DROP TRIGGER IF EXISTS trigger_insert_node;
DROP TRIGGER IF EXISTS trigger_update_node;
DROP TRIGGER IF EXISTS trigger_delete_node;

# ==================================================
# ELM_USER CREATE TRIGGER
# ==================================================
USE `elm_release`;
delimiter |
CREATE TRIGGER trigger_insert_node AFTER INSERT ON `elm_release`.`ELM_NODE`
FOR EACH ROW
BEGIN
    INSERT INTO `elm_debug`.`ELM_NODE`(
		`NODEID`,
		`TITLE`,
		`TEXTID`) 
	VALUES(
		NEW.`NODEID`,
		NEW.`TITLE`,
		NEW.`TEXTID`);
END;
|
delimiter ;

# ==================================================
# ELM_USER UPDATE TRIGGER
# ==================================================
USE `elm_release`;
delimiter |
CREATE TRIGGER trigger_update_node AFTER UPDATE ON `elm_release`.`ELM_NODE`
FOR EACH ROW
BEGIN
    UPDATE 
		`elm_debug`.`ELM_NODE`
    SET
		`TITLE` = NEW.`TITLE`,
		`TEXTID` = NEW.`TEXTID`
	WHERE 
		`NODEID` = NEW.`NODEID`;
END;
|
delimiter ;

# ==================================================
# ELM_USER DELETE TRIGGER
# ==================================================
USE `elm_release`;
delimiter |
CREATE TRIGGER trigger_delete_node AFTER DELETE ON `elm_release`.`ELM_NODE`
FOR EACH ROW
BEGIN
    DELETE FROM   
		`elm_debug`.`ELM_NODE`
	WHERE 
		`NODEID` = OLD.`NODEID`;
END;
|
delimiter ;