require('dotenv').config();
require('./../src/global_constants').CONFIG;
 
CONFIG.db_host      = process.env.DB_HOST       || 'event365.cu0csbjr1qku.us-east-2.rds.amazonaws.com';
CONFIG.db_name      = process.env.DB_NAME       || 'event365';
CONFIG.db_user      = process.env.DB_USER       || 'event365';
CONFIG.db_password  = process.env.DB_PASSWORD   || 'event365';

const sendgrid = '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';

module.exports = {
    development: {
        username: CONFIG.db_user,
        password: CONFIG.db_password,
        database: CONFIG.db_name,
        host: CONFIG.db_host,
        dialect: CONFIG.db_dialect
    },
    test: {
        username: CONFIG.db_user,
        password: CONFIG.db_password,
        database: CONFIG.db_name,
        host: CONFIG.db_host,
        dialect: CONFIG.db_dialect
    },
    production: {
        username: CONFIG.db_user,
        password: CONFIG.db_password,
        database: CONFIG.db_name,
        host: CONFIG.db_host,
        dialect: CONFIG.db_dialect
    },
    sendgrid: sendgrid
}
