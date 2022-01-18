
exports.up = function(knex, Promise) {
    return knex.schema.createTable('eventChooseSubcategory',function(table){
        table.increments('id').primary();
        table.integer('eventId').unsigned().references('id').inTable('events').onDelete('cascade');
        table.integer('categoryId').unsigned().references('id').inTable('category').onDelete('cascade');
        table.integer('subCategoryId').unsigned().references('id').inTable('subCategory').onDelete('cascade');
        table.integer('userId');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
  
};

exports.down = function(knex, Promise) {
  
};
