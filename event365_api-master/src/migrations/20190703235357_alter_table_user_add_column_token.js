exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', function(table) {
        table.string('token');
    })
  };
  
  exports.down = function(knex, Promise) {
    
  };