-- 星座运势表升级脚本（MySQL 兼容版本）
-- 添加周运、月运、年运字段到现有表

-- 周运字段
ALTER TABLE `constellation_fortune`
ADD COLUMN `week_overall` INT DEFAULT 0 COMMENT '周综合指数' AFTER `summary`,
ADD COLUMN `week_love` INT DEFAULT 0 COMMENT '周爱情指数' AFTER `week_overall`,
ADD COLUMN `week_work` INT DEFAULT 0 COMMENT '周工作指数' AFTER `week_love`,
ADD COLUMN `week_wealth` INT DEFAULT 0 COMMENT '周财富指数' AFTER `week_work`,
ADD COLUMN `week_health` INT DEFAULT 0 COMMENT '周健康指数' AFTER `week_wealth`,
ADD COLUMN `week_summary` TEXT COMMENT '周运势概述' AFTER `week_health`,
ADD COLUMN `week_lucky_color` VARCHAR(50) DEFAULT NULL COMMENT '周幸运颜色' AFTER `week_summary`,
ADD COLUMN `week_lucky_number` INT DEFAULT NULL COMMENT '周幸运数字' AFTER `week_lucky_color`;

-- 月运字段
ALTER TABLE `constellation_fortune`
ADD COLUMN `month_overall` INT DEFAULT 0 COMMENT '月综合指数' AFTER `week_lucky_number`,
ADD COLUMN `month_love` INT DEFAULT 0 COMMENT '月爱情指数' AFTER `month_overall`,
ADD COLUMN `month_work` INT DEFAULT 0 COMMENT '月工作指数' AFTER `month_love`,
ADD COLUMN `month_wealth` INT DEFAULT 0 COMMENT '月财富指数' AFTER `month_work`,
ADD COLUMN `month_health` INT DEFAULT 0 COMMENT '月健康指数' AFTER `month_wealth`,
ADD COLUMN `month_summary` TEXT COMMENT '月运势概述' AFTER `month_health`,
ADD COLUMN `month_lucky_color` VARCHAR(50) DEFAULT NULL COMMENT '月幸运颜色' AFTER `month_summary`,
ADD COLUMN `month_lucky_number` INT DEFAULT NULL COMMENT '月幸运数字' AFTER `month_lucky_color`;

-- 年运字段
ALTER TABLE `constellation_fortune`
ADD COLUMN `year_overall` INT DEFAULT 0 COMMENT '年综合指数' AFTER `month_lucky_number`,
ADD COLUMN `year_love` INT DEFAULT 0 COMMENT '年爱情指数' AFTER `year_overall`,
ADD COLUMN `year_work` INT DEFAULT 0 COMMENT '年工作指数' AFTER `year_love`,
ADD COLUMN `year_wealth` INT DEFAULT 0 COMMENT '年财富指数' AFTER `year_work`,
ADD COLUMN `year_health` INT DEFAULT 0 COMMENT '年健康指数' AFTER `year_wealth`,
ADD COLUMN `year_summary` TEXT COMMENT '年运势概述' AFTER `year_health`;

-- 其他字段
ALTER TABLE `constellation_fortune`
ADD COLUMN `lucky_direction` VARCHAR(50) DEFAULT NULL COMMENT '幸运方位' AFTER `lucky_number`,
ADD COLUMN `yi` TEXT COMMENT '宜' AFTER `lucky_direction`,
ADD COLUMN `ji` TEXT COMMENT '忌' AFTER `yi`;
