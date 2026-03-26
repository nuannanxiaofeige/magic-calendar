-- ============================================
-- 最新油价表迁移脚本
-- 功能：创建最新油价表并从历史表迁移当前最新数据
-- ============================================

USE chronos_eye;

-- 1. 创建最新油价表（如果不存在）
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

-- 2. 从历史表迁移每个省份的最新数据到最新表
INSERT INTO oil_province_price_latest (
  province, province_code,
  price_89, price_92, price_95, price_98, price_0,
  change_89, change_92, change_95, change_98, change_0,
  price_date, created_at, updated_at
)
SELECT
  p1.province, p1.province_code,
  p1.price_89, p1.price_92, p1.price_95, p1.price_98, p1.price_0,
  p1.change_89, p1.change_92, p1.change_95, p1.change_98, p1.change_0,
  p1.price_date, NOW(), NOW()
FROM oil_province_price p1
INNER JOIN (
  SELECT province_code, MAX(price_date) as max_date
  FROM oil_province_price
  GROUP BY province_code
) p2 ON p1.province_code = p2.province_code AND p1.price_date = p2.max_date
ON DUPLICATE KEY UPDATE
  province = VALUES(province),
  price_89 = VALUES(price_89),
  price_92 = VALUES(price_92),
  price_95 = VALUES(price_95),
  price_98 = VALUES(price_98),
  price_0 = VALUES(price_0),
  change_89 = VALUES(change_89),
  change_92 = VALUES(change_92),
  change_95 = VALUES(change_95),
  change_98 = VALUES(change_98),
  change_0 = VALUES(change_0),
  price_date = VALUES(price_date),
  updated_at = NOW();

-- 3. 验证迁移结果
SELECT '迁移完成！' as status;
SELECT COUNT(*) as latest_count FROM oil_province_price_latest;
SELECT price_date, COUNT(*) as records FROM oil_province_price_latest GROUP BY price_date;
