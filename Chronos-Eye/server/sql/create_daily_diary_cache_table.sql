-- 每日日记缓存表
-- 记录每天随机选中的舔狗日记和打工者日记，当日固定不变
CREATE TABLE IF NOT EXISTS daily_diary_cache (
  date DATE NOT NULL COMMENT '日期 YYYY-MM-DD',
  tiangou_diary_id INT DEFAULT NULL COMMENT '舔狗日记ID',
  worker_diary_id INT DEFAULT NULL COMMENT '打工者日记ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (date),
  KEY idx_tiangou (tiangou_diary_id),
  KEY idx_worker (worker_diary_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日日记缓存表';