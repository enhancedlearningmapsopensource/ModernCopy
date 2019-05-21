USE `elm_release`;
DROP TRIGGER IF EXISTS trigger_insert_usergroup;
DROP TRIGGER IF EXISTS trigger_delete_usergroup;


# ==================================================
# ELM_USER CREATE TRIGGER
# ==================================================
USE `elm_release`;
delimiter |
CREATE TRIGGER trigger_insert_usergroup AFTER INSERT ON `elm_release`.`ELM_USERGROUP`
FOR EACH ROW
BEGIN
    INSERT INTO `elm_debug`.`ELM_USERGROUP`(
		`GROUPID`,
		`USERID`) 
	VALUES(
		NEW.`GROUPID`,
		NEW.`USERID`);
END;
|
delimiter ;


# ==================================================
# ELM_USER DELETE TRIGGER
# ==================================================
USE `elm_release`;
delimiter |
CREATE TRIGGER trigger_delete_usergroup AFTER DELETE ON `elm_release`.`ELM_USERGROUP`
FOR EACH ROW
BEGIN
    DELETE FROM   
		`elm_debug`.`ELM_USERGROUP`
	WHERE 
		`GROUPID` = OLD.`GROUPID` AND `USERID` = OLD.`USERID`;
END;
|
delimiter ;