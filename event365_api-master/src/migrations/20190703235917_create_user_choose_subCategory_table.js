
exports.up = function(knex) {
    return knex.schema.createTable('userChooseSubcategory', function(table){
        table.increments('id').primary();
        table.integer('categoryId').unsigned().references('id').inTable('userChooseCategory').onDelete('CASCADE');
        table.integer('subCategoryId').notNullable();
    })
  };
  
  exports.down = function(knex) {
      return knex.schema.dropTableIfExists('userChooseSubcategory');
  };