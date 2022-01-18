
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('venue', function(table){
      table.text('shortDescription').alter();
  })
};

exports.down = function(knex, Promise) {
  
};
