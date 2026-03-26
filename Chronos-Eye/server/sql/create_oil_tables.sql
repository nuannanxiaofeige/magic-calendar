-- 油价数据表初始化脚本
-- 用于创建油价相关的数据库表

USE chronos_eye;

-- ============================================
-- 全国各省油价数据表
-- ============================================
CREATE TABLE IF NOT EXISTS `oil_province_price` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键 ID',
  `province` VARCHAR(20) NOT NULL COMMENT '省份名称',
  `province_code` VARCHAR(20) NOT NULL COMMENT '省份代码 (如 beijing、shanghai)',
  `price_89` DECIMAL(5,2) DEFAULT NULL COMMENT '89 号汽油价格',
  `price_92` DECIMAL(5,2) DEFAULT NULL COMMENT '92 号汽油价格',
  `price_95` DECIMAL(5,2) DEFAULT NULL COMMENT '95 号汽油价格',
  `price_98` DECIMAL(5,2) DEFAULT NULL COMMENT '98 号汽油价格',
  `price_0` DECIMAL(5,2) DEFAULT NULL COMMENT '0 号柴油价格',
  `change_89` DECIMAL(5,2) DEFAULT NULL COMMENT '89 号涨幅',
  `change_92` DECIMAL(5,2) DEFAULT NULL COMMENT '92 号涨幅',
  `change_95` DECIMAL(5,2) DEFAULT NULL COMMENT '95 号涨幅',
  `change_98` DECIMAL(5,2) DEFAULT NULL COMMENT '98 号涨幅',
  `change_0` DECIMAL(5,2) DEFAULT NULL COMMENT '0 号涨幅',
  `price_date` DATE NOT NULL COMMENT '数据日期',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_code_date` (`province_code`, `price_date`),
  KEY `idx_province` (`province`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='全国各省油价数据表';

-- ============================================
-- 国际原油价格表
-- ============================================
CREATE TABLE IF NOT EXISTS `oil_international` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键 ID',
  `oil_name` VARCHAR(50) NOT NULL COMMENT '油品名称 (如布伦特原油)',
  `price` DECIMAL(10,2) DEFAULT NULL COMMENT '最新价格',
  `change` DECIMAL(10,2) DEFAULT NULL COMMENT '涨跌额',
  `change_percent` VARCHAR(20) DEFAULT NULL COMMENT '涨跌幅',
  `prev_close` DECIMAL(10,2) DEFAULT NULL COMMENT '昨收价',
  `high` DECIMAL(10,2) DEFAULT NULL COMMENT '最高价',
  `low` DECIMAL(10,2) DEFAULT NULL COMMENT '最低价',
  `update_time` DATETIME DEFAULT NULL COMMENT '更新时间',
  `data_date` DATE DEFAULT NULL COMMENT '数据日期',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY `uk_oil_date` (`oil_name`, `data_date`),
  KEY `idx_oil_name` (`oil_name`),
  KEY `idx_data_date` (`data_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='国际原油价格表';

-- ============================================
-- 油价调整历史表
-- ============================================
CREATE TABLE IF NOT EXISTS `oil_adjustment_history` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键 ID',
  `rank` INT DEFAULT NULL COMMENT '排名',
  `adjust_date` DATE NOT NULL COMMENT '调整日期',
  `gasoline_price` INT DEFAULT NULL COMMENT '汽油价格 (元/吨)',
  `gasoline_change` INT DEFAULT NULL COMMENT '汽油涨跌 (元/吨)',
  `diesel_price` INT DEFAULT NULL COMMENT '柴油价格 (元/吨)',
  `diesel_change` INT DEFAULT NULL COMMENT '柴油涨跌 (元/吨)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_adjust_date` (`adjust_date`),
  KEY `idx_gasoline` (`gasoline_price`),
  KEY `idx_diesel` (`diesel_price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='油价调整历史表';

-- ============================================
-- 全国各省最新油价表（只保留每个省份的最新数据）
-- ============================================
CREATE TABLE IF NOT EXISTS `oil_province_price_latest` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键 ID',
  `province` VARCHAR(20) NOT NULL COMMENT '省份名称',
  `province_code` VARCHAR(20) NOT NULL UNIQUE COMMENT '省份代码 (如 beijing、shanghai)',
  `price_89` DECIMAL(5,2) DEFAULT NULL COMMENT '89 号汽油价格',
  `price_92` DECIMAL(5,2) DEFAULT NULL COMMENT '92 号汽油价格',
  `price_95` DECIMAL(5,2) DEFAULT NULL COMMENT '95 号汽油价格',
  `price_98` DECIMAL(5,2) DEFAULT NULL COMMENT '98 号汽油价格',
  `price_0` DECIMAL(5,2) DEFAULT NULL COMMENT '0 号柴油价格',
  `change_89` VARCHAR(20) DEFAULT NULL COMMENT '89 号涨幅',
  `change_92` VARCHAR(20) DEFAULT NULL COMMENT '92 号涨幅',
  `change_95` VARCHAR(20) DEFAULT NULL COMMENT '95 号涨幅',
  `change_98` VARCHAR(20) DEFAULT NULL COMMENT '98 号涨幅',
  `change_0` VARCHAR(20) DEFAULT NULL COMMENT '0 号涨幅',
  `price_date` DATE NOT NULL COMMENT '数据日期',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY `idx_province` (`province`),
  KEY `idx_price_date` (`price_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='全国各省最新油价表';
