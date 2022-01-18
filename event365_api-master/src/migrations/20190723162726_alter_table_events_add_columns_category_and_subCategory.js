
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('events',function(table){
      table.string('categoryId').notNullable();
      table.string('subCategoryId').notNullable();
      table.boolean('guestList').defaultTo(true);
  });
};

exports.down = function(knex, Promise) {
  
};
