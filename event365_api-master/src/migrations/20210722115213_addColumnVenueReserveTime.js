
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('venue', function(table){
        table.datetime('reserveTime');
  })
};

exports.down = function(knex, Promise) {
  
};
