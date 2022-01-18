
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('admin', function(table) {
      table.json('subAdminPermission');
  })
};

exports.down = function(knex, Promise) {
  
};
