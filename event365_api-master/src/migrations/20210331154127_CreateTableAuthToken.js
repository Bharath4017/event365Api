
exports.up = function(knex, Promise) {
  return knex.schema.createTable('authDetail', function(table) {
      table.increments('id')
      table.integer('userId').references('id').inTable('users').onDelete('CASCADE')
      table.string('userType', 15)
      table.string('deviceType', 10)
      table.string('deviceId')
      table.string('deviceToken')
      table.string('authToken')
      table.timestamp('created_at').defaultTo(knex.fn.now())
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'))
  })
};

exports.down = function(knex, Promise) {
  
};
