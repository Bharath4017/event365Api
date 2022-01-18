require('dotenv').config();
require('./../src/global_constants').CONFIG;
 
CONFIG.db_host      = process.env.DB_HOST;
CONFIG.db_name      = process.env.DB_NAME;
CONFIG.db_user      = process.env.DB_USER;
CONFIG.db_password  = process.env.DB_PASSWORD;

module.exports = {
    development: {
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
}
