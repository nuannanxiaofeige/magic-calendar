-- 创建星座运势表（包含今日、本周、本月、年度运势）
CREATE TABLE IF NOT EXISTS `constellation_fortune` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
  `date` DATE NOT NULL COMMENT '日期',
  `sign` VARCHAR(20) NOT NULL COMMENT '星座英文名',
  `sign_name` VARCHAR(10) NOT NULL COMMENT '星座中文名',

  -- 今日运势指数 (0-100)
  `overall` INT DEFAULT 0 COMMENT '综合指数',
  `love` INT DEFAULT 0 COMMENT '爱情指数',
  `work` INT DEFAULT 0 COMMENT '工作指数',
  `wealth` INT DEFAULT 0 COMMENT '财富指数',
  `health` INT DEFAULT 0 COMMENT '健康指数',

  -- 幸运元素
  `lucky_color` VARCHAR(50) DEFAULT NULL COMMENT '幸运颜色',
  `lucky_number` INT DEFAULT NULL COMMENT '幸运数字',
  `lucky_direction` VARCHAR(50) DEFAULT NULL COMMENT '幸运方位',
  `match_sign` VARCHAR(20) DEFAULT NULL COMMENT '贵人星座',

  -- 运势描述
  `summary` TEXT COMMENT '今日概述',
  `yi` TEXT COMMENT '宜',
  `ji` TEXT COMMENT '忌',

  -- 周运指数 (0-100)
  `week_overall` INT DEFAULT 0 COMMENT '周综合指数',
  `week_love` INT DEFAULT 0 COMMENT '周爱情指数',
  `week_work` INT DEFAULT 0 COMMENT '周工作指数',
  `week_wealth` INT DEFAULT 0 COMMENT '周财富指数',
  `week_health` INT DEFAULT 0 COMMENT '周健康指数',
  `week_summary` TEXT COMMENT '周运势概述',
  `week_lucky_color` VARCHAR(50) DEFAULT NULL COMMENT '周幸运颜色',
  `week_lucky_number` INT DEFAULT NULL COMMENT '周幸运数字',

  -- 月运指数 (0-100)
  `month_overall` INT DEFAULT 0 COMMENT '月综合指数',
  `month_love` INT DEFAULT 0 COMMENT '月爱情指数',
  `month_work` INT DEFAULT 0 COMMENT '月工作指数',
  `month_wealth` INT DEFAULT 0 COMMENT '月财富指数',
  `month_health` INT DEFAULT 0 COMMENT '月健康指数',
  `month_summary` TEXT COMMENT '月运势概述',
  `month_lucky_color` VARCHAR(50) DEFAULT NULL COMMENT '月幸运颜色',
  `month_lucky_number` INT DEFAULT NULL COMMENT '月幸运数字',

  -- 年运指数 (0-100)
  `year_overall` INT DEFAULT 0 COMMENT '年综合指数',
  `year_love` INT DEFAULT 0 COMMENT '年爱情指数',
  `year_work` INT DEFAULT 0 COMMENT '年工作指数',
  `year_wealth` INT DEFAULT 0 COMMENT '年财富指数',
  `year_health` INT DEFAULT 0 COMMENT '年健康指数',
  `year_summary` TEXT COMMENT '年运势概述',

  -- 时间戳
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  UNIQUE KEY `uk_date_sign` (`date`, `sign`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='星座运势表';
