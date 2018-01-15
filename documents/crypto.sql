-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema crypto
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema crypto
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `crypto` DEFAULT CHARACTER SET latin1 ;
USE `crypto` ;

-- -----------------------------------------------------
-- Table `crypto`.`crypto_data_source`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `crypto`.`crypto_data_source` (
  `ID` INT(11) NOT NULL AUTO_INCREMENT,
  `crypto_id` VARCHAR(36) NOT NULL,
  `data_url` TEXT NULL DEFAULT NULL,
  `attention` TINYINT(4) NULL DEFAULT NULL,
  `platform_crypto_symbol` VARCHAR(126) NULL DEFAULT NULL,
  `platform` VARCHAR(120) NOT NULL,
  PRIMARY KEY (`ID`, `crypto_id`),
  UNIQUE INDEX `crypto_id_UNIQUE` (`crypto_id` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `crypto`.`crypto_info`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `crypto`.`crypto_info` (
  `symbol` VARCHAR(45) NOT NULL COMMENT 'The symbol of the respective crypto coin',
  `name` VARCHAR(45) NOT NULL COMMENT 'Name of the crypto',
  `description` BLOB NULL DEFAULT NULL COMMENT 'Description of the crypto coin or token',
  `url` VARCHAR(256) NULL DEFAULT NULL COMMENT 'Url to the home page',
  `type` VARCHAR(45) NOT NULL COMMENT 'Coin or Token',
  `attention` TINYINT(4) NULL DEFAULT NULL,
  `platform` VARCHAR(45) NULL DEFAULT NULL,
  `ID` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'local db id. Auto increment',
  `crypto_id` VARCHAR(36) NOT NULL,
  `source` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`ID`, `crypto_id`),
  UNIQUE INDEX `ID_UNIQUE` (`ID` ASC),
  UNIQUE INDEX `crypto_id_UNIQUE` (`crypto_id` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
