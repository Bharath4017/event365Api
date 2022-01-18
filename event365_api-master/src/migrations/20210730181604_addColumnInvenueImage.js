
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('venueImages', function(table){
      table.boolean('isPrimary').default(false);
  })
};

exports.down = function(knex, Promise) {
  
};
