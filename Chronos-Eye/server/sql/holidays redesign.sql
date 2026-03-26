-- ============================================
-- 节假日表 - 重新设计
-- 用于存储天行 API 返回的节假日数据
-- ============================================

-- 禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `holidays`;
CREATE TABLE `holidays` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键 ID',
  `name` VARCHAR(100) NOT NULL COMMENT '节日名称',
  `type` ENUM('festival', 'solar', 'lunar', 'term') NOT NULL DEFAULT 'solar' COMMENT '类型：festival-法定节假日，solar-公历节日，lunar-农历节日，term-节气',

  -- 日期信息
  `date_full` DATE COMMENT '完整日期 (用于具体某一天)',
  `date_month` INT COMMENT '月份',
  `date_day` INT COMMENT '日期',
  `weekday` INT DEFAULT 0 COMMENT '星期几 (0-周日，1-周一...)',

  -- 农历信息
  `lunar_month` INT COMMENT '农历月份',
  `lunar_day` INT COMMENT '农历日期',
  `is_leap` TINYINT DEFAULT 0 COMMENT '是否闰月',

  -- 假期详情 - 天行 API 字段
  `vacation_dates` TEXT COMMENT '放假日期列表，|分隔',
  `work_dates` TEXT COMMENT '调休上班日期列表，|分隔',
  `wage_dates` TEXT COMMENT '三倍工资日期列表，|分隔',

  -- 假期属性
  `is_official` TINYINT DEFAULT 0 COMMENT '是否法定节假日',
  `is_rest` TINYINT DEFAULT 1 COMMENT '是否休息日 (1-休息，0-上班)',
  `is_work` TINYINT DEFAULT 0 COMMENT '是否调休上班 (1-调休上班)',
  `duration` INT DEFAULT 1 COMMENT '假期持续天数',

  -- 描述信息
  `tip` TEXT COMMENT '放假调休说明',
  `rest_tip` TEXT COMMENT '请假建议 (天行 API 的 rest 字段)',
  `description` TEXT COMMENT '节日描述',
  `customs` TEXT COMMENT '习俗',

  -- 天行 API 原始数据
  `holiday_str` VARCHAR(50) COMMENT '天行 API 返回的 holiday 字段 (如"1 月 1 号")',
  `start` INT DEFAULT 0 COMMENT '假期开始偏移',
  `end` INT DEFAULT 0 COMMENT '假期结束偏移',
  `now` INT DEFAULT 0 COMMENT '当前状态',

  -- 管理字段
  `year` INT COMMENT '年份',
  `is_active` TINYINT DEFAULT 1 COMMENT '是否启用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_date_full` (`date_full`),
  INDEX `idx_year` (`year`),
  INDEX `idx_type` (`type`),
  INDEX `idx_month_day` (`date_month`, `date_day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='节假日表';

-- ============================================
-- 节气日期表 - 用于存储每年节气的具体日期
-- ============================================
DROP TABLE IF EXISTS `almanac_term_dates`;
CREATE TABLE `almanac_term_dates` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `year` INT NOT NULL COMMENT '年份',
  `term_name` VARCHAR(50) NOT NULL COMMENT '节气名称',
  `term_order` INT NOT NULL COMMENT '节气序号 (1-24)',
  `date` DATE NOT NULL COMMENT '交节日期',
  `time` VARCHAR(10) DEFAULT '00:00' COMMENT '交节时间',
  `week` INT DEFAULT 0 COMMENT '星期几',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_year_term` (`year`, `term_name`),
  INDEX `idx_year` (`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='二十四节气日期表';

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;
