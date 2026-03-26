-- ============================================
-- 为 almanac_term_dates 表添加天行 API 详情字段
-- 添加：yiji(宜忌), shiju(诗句), xishu(习俗), meishi(美食), jieshao(介绍), yuanyin(原因)
-- ============================================

ALTER TABLE `almanac_term_dates`
ADD COLUMN `yiji` TEXT COMMENT '节气宜忌' AFTER `term_time`,
ADD COLUMN `shiju` VARCHAR(500) COMMENT '节气诗句' AFTER `yiji`,
ADD COLUMN `xishu` TEXT COMMENT '节气习俗' AFTER `shiju`,
ADD COLUMN `meishi` TEXT COMMENT '节气美食' AFTER `xishu`,
ADD COLUMN `jieshao` TEXT COMMENT '节气介绍' AFTER `meishi`,
ADD COLUMN `yuanyin` VARCHAR(255) COMMENT '节气原因/由来' AFTER `jieshao`,
ADD COLUMN `day` VARCHAR(50) COMMENT '日期范围 (如：2 月 4 日或 5 日)' AFTER `yuanyin`,
ADD COLUMN `cnday` VARCHAR(20) COMMENT '农历日' AFTER `day`,
ADD COLUMN `cnyear` VARCHAR(20) COMMENT '农历年' AFTER `cnday`,
ADD COLUMN `cnmonth` VARCHAR(20) COMMENT '农历月' AFTER `cnyear`,
ADD COLUMN `cnzodiac` VARCHAR(10) COMMENT '农历生肖' AFTER `cnmonth`,
ADD COLUMN `gregdate` DATE COMMENT '公历日期' AFTER `cnzodiac`,
ADD COLUMN `lunardate` VARCHAR(50) COMMENT '农历日期' AFTER `gregdate`,
ADD COLUMN `nameimg` VARCHAR(100) COMMENT '节气图文件名' AFTER `lunardate`;

-- 添加索引以优化查询
ALTER TABLE `almanac_term_dates`
ADD INDEX `idx_term_name` (`term_name`);
