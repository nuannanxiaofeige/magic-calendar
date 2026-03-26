-- 星座运势表升级脚本
-- 添加周运、月运、年运字段到现有表

-- 如果字段不存在则添加
-- 周运字段
ALTER TABLE `constellation_fortune`
ADD COLUMN IF NOT EXISTS `week_overall` INT DEFAULT 0 COMMENT '周综合指数' AFTER `summary`,
ADD COLUMN IF NOT EXISTS `week_love` INT DEFAULT 0 COMMENT '周爱情指数',
ADD COLUMN IF NOT EXISTS `week_work` INT DEFAULT 0 COMMENT '周工作指数',
ADD COLUMN IF NOT EXISTS `week_wealth` INT DEFAULT 0 COMMENT '周财富指数',
ADD COLUMN IF NOT EXISTS `week_health` INT DEFAULT 0 COMMENT '周健康指数',
ADD COLUMN IF NOT EXISTS `week_summary` TEXT COMMENT '周运势概述',
ADD COLUMN IF NOT EXISTS `week_lucky_color` VARCHAR(50) DEFAULT NULL COMMENT '周幸运颜色',
ADD COLUMN IF NOT EXISTS `week_lucky_number` INT DEFAULT NULL COMMENT '周幸运数字';

-- 月运字段
ALTER TABLE `constellation_fortune`
ADD COLUMN IF NOT EXISTS `month_overall` INT DEFAULT 0 COMMENT '月综合指数',
ADD COLUMN IF NOT EXISTS `month_love` INT DEFAULT 0 COMMENT '月爱情指数',
ADD COLUMN IF NOT EXISTS `month_work` INT DEFAULT 0 COMMENT '月工作指数',
ADD COLUMN IF NOT EXISTS `month_wealth` INT DEFAULT 0 COMMENT '月财富指数',
ADD COLUMN IF NOT EXISTS `month_health` INT DEFAULT 0 COMMENT '月健康指数',
ADD COLUMN IF NOT EXISTS `month_summary` TEXT COMMENT '月运势概述',
ADD COLUMN IF NOT EXISTS `month_lucky_color` VARCHAR(50) DEFAULT NULL COMMENT '月幸运颜色',
ADD COLUMN IF NOT EXISTS `month_lucky_number` INT DEFAULT NULL COMMENT '月幸运数字';

-- 年运字段
ALTER TABLE `constellation_fortune`
ADD COLUMN IF NOT EXISTS `year_overall` INT DEFAULT 0 COMMENT '年综合指数',
ADD COLUMN IF NOT EXISTS `year_love` INT DEFAULT 0 COMMENT '年爱情指数',
ADD COLUMN IF NOT EXISTS `year_work` INT DEFAULT 0 COMMENT '年工作指数',
ADD COLUMN IF NOT EXISTS `year_wealth` INT DEFAULT 0 COMMENT '年财富指数',
ADD COLUMN IF NOT EXISTS `year_health` INT DEFAULT 0 COMMENT '年健康指数',
ADD COLUMN IF NOT EXISTS `year_summary` TEXT COMMENT '年运势概述';

-- 其他字段
ALTER TABLE `constellation_fortune`
ADD COLUMN IF NOT EXISTS `lucky_direction` VARCHAR(50) DEFAULT NULL COMMENT '幸运方位' AFTER `lucky_number`,
ADD COLUMN IF NOT EXISTS `yi` TEXT COMMENT '宜' AFTER `summary`,
ADD COLUMN IF NOT EXISTS `ji` TEXT COMMENT '忌' AFTER `yi`;
