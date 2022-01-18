
exports.up = function(knex) {
    return knex.schema.createTable('subCategory',function(table){
  
      table.increments('id').primary();
      table.integer('categoryId').unsigned().references('id').inTable('category').onDelete('CASCADE');
      
      table.string('subCategoryName').notNullable();
    })
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('subCategory')
  };
  