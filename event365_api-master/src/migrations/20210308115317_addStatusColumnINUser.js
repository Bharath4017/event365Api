
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('users', function(table) {
    table.enum('accountStatus', ['active', 'inactive', 'flagged']).defaultTo('active');
  })
};

exports.down = function(knex, Promise) {
  
};
