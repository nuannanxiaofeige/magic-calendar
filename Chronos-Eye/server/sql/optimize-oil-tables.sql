-- ============================================
-- 油价数据表结构优化迁移脚本
-- 功能：
--   1. 修改省份油价表的涨幅字段为 DECIMAL 类型
--   2. 修改国际原油表的价格字段为 DECIMAL 类型
--   3. 修改国际原油表的 update_time 为 DATETIME 类型
--   4. 添加唯一约束 (oil_name, data_date)
-- ============================================

USE chronos_eye;

-- ============================================
-- 1. 修改省份油价表的涨幅字段为 DECIMAL
-- ============================================
ALTER TABLE oil_province_price
MODIFY COLUMN change_89 DECIMAL(5,2) DEFAULT NULL COMMENT '89 号涨幅',
MODIFY COLUMN change_92 DECIMAL(5,2) DEFAULT NULL COMMENT '92 号涨幅',
MODIFY COLUMN change_95 DECIMAL(5,2) DEFAULT NULL COMMENT '95 号涨幅',
MODIFY COLUMN change_98 DECIMAL(5,2) DEFAULT NULL COMMENT '98 号涨幅',
MODIFY COLUMN change_0 DECIMAL(5,2) DEFAULT NULL COMMENT '0 号涨幅';

-- ============================================
-- 2. 修改国际原油表的字段类型
-- ============================================
-- 先清理重复数据，保留每个 oil_name + data_date 的最新一条
DELETE t1 FROM oil_international t1
INNER JOIN oil_international t2
WHERE t1.id > t2.id
  AND t1.oil_name = t2.oil_name
  AND t1.data_date = t2.data_date;

-- 修改字段类型
ALTER TABLE oil_international
MODIFY COLUMN price DECIMAL(10,2) DEFAULT NULL COMMENT '最新价格',
MODIFY COLUMN `change` DECIMAL(10,2) DEFAULT NULL COMMENT '涨跌额',
MODIFY COLUMN prev_close DECIMAL(10,2) DEFAULT NULL COMMENT '昨收价',
MODIFY COLUMN high DECIMAL(10,2) DEFAULT NULL COMMENT '最高价',
MODIFY COLUMN low DECIMAL(10,2) DEFAULT NULL COMMENT '最低价',
MODIFY COLUMN update_time DATETIME DEFAULT NULL COMMENT '更新时间';

-- ============================================
-- 3. 添加唯一约束
-- ============================================
ALTER TABLE oil_international
ADD UNIQUE KEY uk_oil_date (oil_name, data_date);

-- ============================================
-- 4. 验证修改结果
-- ============================================
SELECT '迁移完成！' as status;

-- 显示表结构
DESC oil_province_price;
DESC oil_international;

-- 显示索引
SHOW INDEX FROM oil_province_price;
SHOW INDEX FROM oil_international;
