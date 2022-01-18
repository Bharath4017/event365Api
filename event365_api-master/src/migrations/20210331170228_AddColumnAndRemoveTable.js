
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('userLoginDetails', function(table) {
      table.string('authToken')
  }).dropTable('authDetail')
};

exports.down = function(knex, Promise) {
  
};
