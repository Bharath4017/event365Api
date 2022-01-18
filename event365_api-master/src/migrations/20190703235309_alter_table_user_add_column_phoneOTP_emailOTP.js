
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', function(table) {
      table.integer('phoneOTP');
      table.integer('emailOTP');
    })};
  
  exports.down = function(knex, Promise) {
    
  };
  