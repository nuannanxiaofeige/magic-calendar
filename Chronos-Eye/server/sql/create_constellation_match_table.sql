-- 创建星座配对表
CREATE TABLE IF NOT EXISTS `constellation_match` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
  `sign1` VARCHAR(20) NOT NULL COMMENT '第一个星座（英文名）',
  `sign2` VARCHAR(20) NOT NULL COMMENT '第二个星座（英文名）',
  `sign1_name` VARCHAR(20) NOT NULL COMMENT '第一个星座中文名',
  `sign2_name` VARCHAR(20) NOT NULL COMMENT '第二个星座中文名',
  `title` VARCHAR(100) DEFAULT NULL COMMENT '标题',
  `grade` TEXT COMMENT '点评（友情、爱情、婚姻、亲情评分）',
  `content` TEXT COMMENT '配对内容解说',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_sign1_sign2` (`sign1`, `sign2`),
  INDEX `idx_sign1` (`sign1`),
  INDEX `idx_sign2` (`sign2`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='星座配对表';
