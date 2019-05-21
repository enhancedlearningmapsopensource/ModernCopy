USE `elm_release`;
DROP TRIGGER IF EXISTS trigger_insert_group;
DROP TRIGGER IF EXISTS trigger_update_group;
DROP TRIGGER IF EXISTS trigger_delete_group;

# ==================================================
# ELM_USER CREATE TRIGGER
# ==================================================
USE `elm_release`;
delimiter |
CREATE TRIGGER trigger_insert_group AFTER INSERT ON `elm_release`.`ELM_GROUP`
FOR EACH ROW
BEGIN
    INSERT INTO `elm_debug`.`ELM_GROUP`(
		`GROUPID`,
		`NAME`) 
	VALUES(
		NEW.`GROUPID`,
		NEW.`NAME`);
END;
|
delimiter ;

# ==================================================
# ELM_USER UPDATE TRIGGER
# ==================================================
USE `elm_release`;
delimiter |
CREATE TRIGGER trigger_update_group AFTER UPDATE ON `elm_release`.`ELM_GROUP`
FOR EACH ROW
BEGIN
    UPDATE 
		`elm_debug`.`ELM_GROUP`
    SET
		`NAME` = NEW.`NAME`
	WHERE 
		`GROUPID` = NEW.`GROUPID`;
END;
|
delimiter ;

# ==================================================
# ELM_USER DELETE TRIGGER
# ==================================================
USE `elm_release`;
delimiter |
CREATE TRIGGER trigger_delete_group AFTER DELETE ON `elm_release`.`ELM_GROUP`
FOR EACH ROW
BEGIN
    DELETE FROM   
		`elm_debug`.`ELM_GROUP`
	WHERE 
		`GROUPID` = OLD.`GROUPID`;
END;
|
delimiter ;