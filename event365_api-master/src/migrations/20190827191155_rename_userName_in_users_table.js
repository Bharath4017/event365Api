
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('users',function(table){
      table.dropColumn('userName');
      table.integer('createdBy');
  })
};

exports.down = function(knex, Promise) {
  
};
