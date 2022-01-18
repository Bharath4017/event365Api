
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users',function(table){
        table.string('userType').alter();
        table.string('roles');
    })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('admin')
};