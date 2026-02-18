const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET || 'secret',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '15m',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refreshsecret',
    JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_EMAIL: process.env.SMTP_EMAIL,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    FROM_EMAIL: process.env.FROM_EMAIL,
    FROM_NAME: process.env.FROM_NAME,
    NODE_ENV: process.env.NODE_ENV || 'development'
};
