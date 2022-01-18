
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events',function(table){
        table.integer('categoryId').alter();
        table.integer('subCategoryId').alter();
    })
  };
  
  exports.down = function(knex, Promise) {
    
  };
  