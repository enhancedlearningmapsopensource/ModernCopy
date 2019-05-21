USE `elm_release`;
DROP TRIGGER IF EXISTS trigger_insert_user;
DROP TRIGGER IF EXISTS trigger_update_user;
DROP TRIGGER IF EXISTS trigger_delete_user;

# ==================================================
# ELM_USER CREATE TRIGGER
# ==================================================
USE `elm_release`;
delimiter |
CREATE TRIGGER trigger_insert_user AFTER INSERT ON `elm_release`.`ELM_USER`
FOR EACH ROW
BEGIN
    INSERT INTO `elm_debug`.`ELM_USER`(
		`USERID`,
		`EMAIL`,
		`NAME`,
		`PASS`) 
	VALUES(
		NEW.`USERID`,
		NEW.`EMAIL`,
		NEW.`NAME`,
		NEW.`PASS`);
END;
|
delimiter ;

# ==================================================
# ELM_USER UPDATE TRIGGER
# ==================================================
USE `elm_release`;
delimiter |
CREATE TRIGGER trigger_update_user AFTER UPDATE ON `elm_release`.`ELM_USER`
FOR EACH ROW
BEGIN
    UPDATE 
		`elm_debug`.`ELM_USER`
    SET
		`EMAIL` = NEW.`EMAIL`,
		`NAME` = NEW.`NAME`,
		`PASS` = NEW.`PASS`
	WHERE 
		`USERID` = NEW.`USERID`;
END;
|
delimiter ;

# ==================================================
# ELM_USER DELETE TRIGGER
# ==================================================
USE `elm_release`;
delimiter |
CREATE TRIGGER trigger_delete_user AFTER DELETE ON `elm_release`.`ELM_USER`
FOR EACH ROW
BEGIN
    DELETE FROM   
		`elm_debug`.`ELM_USER`
	WHERE 
		`USERID` = OLD.`USERID`;
END;
|
delimiter ;