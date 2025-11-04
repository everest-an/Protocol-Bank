const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 配置数据库连接
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'protocol_bank',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

// 如果是AWS RDS,添加SSL配置
if (process.env.DB_HOST && process.env.DB_HOST.includes('rds.amazonaws.com')) {
  const certPath = path.join(__dirname, '..', '..', 'ap-southeast-2-bundle.pem');
  
  if (fs.existsSync(certPath)) {
    poolConfig.ssl = {
      ca: fs.readFileSync(certPath).toString(),
      rejectUnauthorized: true
    };
    console.log('✅ Using AWS RDS CA certificate for SSL connection');
  } else {
    // 如果证书文件不存在,使用不验证证书的方式(临时方案)
    poolConfig.ssl = {
      rejectUnauthorized: false
    };
    console.warn('⚠️  RDS CA certificate not found, using unverified SSL connection');
  }
}

const pool = new Pool(poolConfig);

// 连接事件监听
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

// 测试连接
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection test failed:', err.message);
  } else {
    console.log('✅ Database connection test passed:', res.rows[0].now);
  }
});

module.exports = { pool };
