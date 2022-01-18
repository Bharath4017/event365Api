
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('category',function(table){
      table.string('categoryImage');
  }).
  alterTable('subCategory',function(table){
    table.string('subCategoryImage');
})
};

exports.down = function(knex, Promise) {
  
};
