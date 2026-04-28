-- 为 Chronos Eye 项目创建专用数据库用户
-- 在生产环境执行此脚本，避免使用 root 账号连接数据库

-- 1. 创建专用用户（替换 your_secure_password 为强密码）
CREATE USER IF NOT EXISTS 'chronos_user'@'localhost' IDENTIFIED BY 'f7b996a60e0cda97500ce025610a2f71';

-- 2. 授予项目所需的最小权限（仅 CRUD 操作）
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER
ON chronos_eye.* TO 'chronos_user'@'localhost';

-- 3. 刷新权限
FLUSH PRIVILEGES;

-- 验证权限
-- SHOW GRANTS FOR 'chronos_user'@'localhost';

-- 安全说明：
-- - 不要授予 SUPER、FILE、PROCESS 等高危权限
-- - 不要使用 root 账号在生产环境运行应用
-- - 密码建议使用 20+ 位随机字符串
-- - 生成密码：node -e "console.log(require('crypto').randomBytes(20).toString('hex'))"
