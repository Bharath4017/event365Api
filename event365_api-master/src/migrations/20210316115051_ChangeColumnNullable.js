
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('userChooseSubcategory', function(table){
        table.integer('subCategoryId').nullable().alter();
    })
};

exports.down = function(knex, Promise) {
  
};
