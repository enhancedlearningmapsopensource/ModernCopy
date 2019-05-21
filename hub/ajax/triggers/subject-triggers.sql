USE `elm_release`;
DROP TRIGGER IF EXISTS trigger_insert_subject;
DROP TRIGGER IF EXISTS trigger_update_subject;
DROP TRIGGER IF EXISTS trigger_delete_subject;

# ==================================================
# ELM_USER CREATE TRIGGER
# ==================================================
USE `elm_release`;
delimiter |
CREATE TRIGGER trigger_insert_subject AFTER INSERT ON `elm_release`.`ELM_SUBJECT`
FOR EACH ROW
BEGIN
    INSERT INTO `elm_debug`.`ELM_SUBJECT`(
		`SUBJECT_ID`,
		`NAME`) 
	VALUES(
		NEW.`SUBJECT_ID`,
		NEW.`NAME`);
END;
|
delimiter ;

# ==================================================
# ELM_USER UPDATE TRIGGER
# ==================================================
USE `elm_release`;
delimiter |
CREATE TRIGGER trigger_update_subject AFTER UPDATE ON `elm_release`.`ELM_SUBJECT`
FOR EACH ROW
BEGIN
    UPDATE 
		`elm_debug`.`ELM_SUBJECT`
    SET
		`NAME` = NEW.`NAME`
	WHERE 
		`SUBJECT_ID` = NEW.`SUBJECT_ID`;
END;
|
delimiter ;

# ==================================================
# ELM_USER DELETE TRIGGER
# ==================================================
USE `elm_release`;
delimiter |
CREATE TRIGGER trigger_delete_subject AFTER DELETE ON `elm_release`.`ELM_SUBJECT`
FOR EACH ROW
BEGIN
    DELETE FROM   
		`elm_debug`.`ELM_SUBJECT`
	WHERE 
		`SUBJECT_ID` = OLD.`SUBJECT_ID`;
END;
|
delimiter ;