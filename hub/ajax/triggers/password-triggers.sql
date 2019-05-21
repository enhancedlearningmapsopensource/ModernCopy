USE `elm_release`;

DROP TRIGGER IF EXISTS trigger_insert_password;
DROP TRIGGER IF EXISTS trigger_update_password;
DROP TRIGGER IF EXISTS trigger_delete_password;

# ==================================================
# ELM_USER CREATE TRIGGER
# ==================================================
USE `elm_release`;
delimiter |
CREATE TRIGGER trigger_insert_password AFTER INSERT ON `elm_release`.`ELM_PASSWORD`
FOR EACH ROW
BEGIN
    INSERT INTO `elm_debug`.`ELM_PASSWORD`(
		`USERID`,
		`ITERATIONS`,
		`SALT`) 
	VALUES(
		NEW.`USERID`,
		NEW.`ITERATIONS`,
		NEW.`SALT`);
END;
|
delimiter ;

# ==================================================
# ELM_USER UPDATE TRIGGER
# ==================================================
USE `elm_release`;
delimiter |
CREATE TRIGGER trigger_update_password AFTER UPDATE ON `elm_release`.`ELM_PASSWORD`
FOR EACH ROW
BEGIN
    UPDATE 
		`elm_debug`.`ELM_PASSWORD`
    SET
		`ITERATIONS` = NEW.`ITERATIONS`,
		`SALT` = NEW.`SALT`
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
CREATE TRIGGER trigger_delete_password AFTER DELETE ON `elm_release`.`ELM_PASSWORD`
FOR EACH ROW
BEGIN
    DELETE FROM   
		`elm_debug`.`ELM_PASSWORD`
	WHERE 
		`USERID` = OLD.`USERID`;
END;
|
delimiter ;