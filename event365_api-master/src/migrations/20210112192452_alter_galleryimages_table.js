
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('galleryImages', function(table) {
        table.boolean('isPrimary').defaultTo(false);
   })
};
exports.down = function(knex, Promise) {
  
};
