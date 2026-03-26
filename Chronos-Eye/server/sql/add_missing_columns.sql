-- 为 almanac_data 表添加缺失的字段
-- 用于存储农历节日、节气等信息

USE chronos_eye;

-- 添加农历节日字段
ALTER TABLE `almanac_data`
ADD COLUMN `lunar_festival` VARCHAR(100) DEFAULT NULL COMMENT '农历节日' AFTER `lunar_day`;

-- 添加节气字段
ALTER TABLE `almanac_data`
ADD COLUMN `term` VARCHAR(50) DEFAULT NULL COMMENT '节气' AFTER `lunar_festival`;

-- 添加廿四节气字段（与 term 同义，用于兼容）
ALTER TABLE `almanac_data`
ADD COLUMN `jieqi` VARCHAR(50) DEFAULT NULL COMMENT '二十四节气' AFTER `term`;

-- 添加阳历节日字段
ALTER TABLE `almanac_data`
ADD COLUMN `solar_festival` VARCHAR(100) DEFAULT NULL COMMENT '阳历节日' AFTER `jieqi`;

-- 添加纳音五行字段
ALTER TABLE `almanac_data`
ADD COLUMN `year_na_yin` VARCHAR(50) DEFAULT NULL COMMENT '年柱纳音' AFTER `wuxing`,
ADD COLUMN `month_na_yin` VARCHAR(50) DEFAULT NULL COMMENT '月柱纳音' AFTER `year_na_yin`,
ADD COLUMN `day_na_yin` VARCHAR(50) DEFAULT NULL COMMENT '日柱纳音（同 wuxing）' AFTER `month_na_yin`,
ADD COLUMN `hour_na_yin` VARCHAR(50) DEFAULT NULL COMMENT '时柱纳音' AFTER `day_na_yin`;

-- 添加星座字段
ALTER TABLE `almanac_data`
ADD COLUMN `constellation` VARCHAR(50) DEFAULT NULL COMMENT '星座' AFTER `xingxiu`;

-- 添加月忌字段
ALTER TABLE `almanac_data`
ADD COLUMN `yue_ji` VARCHAR(255) DEFAULT NULL COMMENT '月忌' AFTER `ji`;

-- 添加冲煞字段
ALTER TABLE `almanac_data`
ADD COLUMN `conflict_sha` VARCHAR(50) DEFAULT NULL COMMENT '冲煞方位' AFTER `conflict_zodiac`;

-- 更新 2026 年 3 月的示例数据，添加节气和节日信息
-- 2026 年 3 月 6 日：惊蛰
-- 2026 年 3 月 20 日：春分

UPDATE `almanac_data` SET
  `term` = '惊蛰',
  `jieqi` = '惊蛰',
  `lunar_festival` = NULL
WHERE `date` = '2026-03-06';

UPDATE `almanac_data` SET
  `term` = '春分',
  `jieqi` = '春分',
  `lunar_festival` = NULL
WHERE `date` = '2026-03-20';

-- 2026 年 3 月 2 日：农历二月初三（龙抬头是二月初二，所以这天没有节日）
-- 2026 年 3 月 1 日是农历二月初二：龙抬头
UPDATE `almanac_data` SET
  `lunar_festival` = '龙抬头'
WHERE `date` = '2026-03-01';

-- 查看更新后的数据
SELECT date, lunar_year, lunar_month, lunar_day, lunar_festival, term, jieqi, solar_festival
FROM almanac_data
WHERE MONTH(date) = 3 AND YEAR(date) = 2026;
