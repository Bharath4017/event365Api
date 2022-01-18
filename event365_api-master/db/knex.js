const development = require('./../config/index.js').development;
const production = require('./../config/index.js').production;
module.exports = {

  development: {
    client: 'pg',
    useNullAsDefault: true,
    migrations: {
      directory: './../src/migrations'
    },
    seeds: {
      directory: './../src/seeds'
    },
    connection: {
      host: development.host,
      user: development.username,
      password: development.password,
      database: development.database,
      timezone: "UTC"
    }
  },

  production: {
    client: 'pg',
    migrations: {
      directory: './../src/migrations'
    },
    seeds: {
      directory: './../src/seeds'
    },
    connection: {
      host: production.host,
      user: production.username,
      password: production.password,
      database: production.database
    }
  }
};