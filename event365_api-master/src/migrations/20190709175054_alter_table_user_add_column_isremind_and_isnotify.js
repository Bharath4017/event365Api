
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('users',function(table){
      table.boolean('isRemind').defaultTo(true);
      table.boolean('isNotify').defaultTo(true);
  })
};

exports.down = function(knex, Promise) {
  
};
