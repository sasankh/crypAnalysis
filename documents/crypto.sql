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
  `crypto_id` VARCHAR(36) NOT NULL,
  `data_url` TEXT NOT NULL,
  `attention` TINYINT(4) NOT NULL,
  `platform_crypto_symbol` VARCHAR(126) NOT NULL,
  `platform` VARCHAR(120) NOT NULL,
  `daily_historical_data_last_updated` DATETIME NULL DEFAULT NULL,
  `price_data_epoch_last_updated` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`crypto_id`),
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
  `interest_group` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`ID`, `crypto_id`),
  UNIQUE INDEX `ID_UNIQUE` (`ID` ASC),
  UNIQUE INDEX `crypto_id_UNIQUE` (`crypto_id` ASC))
ENGINE = InnoDB
AUTO_INCREMENT = 1434
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `crypto`.`historical_data`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `crypto`.`historical_data` (
  `id` VARCHAR(36) NOT NULL,
  `crypto_id` VARCHAR(36) NOT NULL,
  `type` VARCHAR(45) NOT NULL,
  `source` VARCHAR(120) NOT NULL,
  `date` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `open` FLOAT NULL DEFAULT NULL,
  `high` FLOAT NULL DEFAULT NULL,
  `low` FLOAT NULL DEFAULT NULL,
  `close` FLOAT NULL DEFAULT NULL,
  `volume` FLOAT NULL DEFAULT NULL,
  `market_cap` FLOAT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `crypto`.`market_cap`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `crypto`.`market_cap` (
  `id` VARCHAR(36) NOT NULL,
  `crypto_id` VARCHAR(36) NOT NULL,
  `source` VARCHAR(120) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `epoch_date` BIGINT(16) NOT NULL,
  `market_cap` FLOAT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `crypto`.`price_data_epoch`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `crypto`.`price_data_epoch` (
  `id` VARCHAR(36) NOT NULL,
  `crypto_id` VARCHAR(36) NOT NULL,
  `source` VARCHAR(120) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `epoch_date` BIGINT(16) NOT NULL,
  `price_usd` FLOAT NOT NULL,
  `price_btc` FLOAT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `crypto`.`volume_24hr`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `crypto`.`volume_24hr` (
  `id` VARCHAR(36) NOT NULL,
  `crypto_id` VARCHAR(36) NOT NULL,
  `source` VARCHAR(120) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `epoch_date` BIGINT(16) NOT NULL,
  `volume` BIGINT(16) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
