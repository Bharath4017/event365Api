
exports.up = function(knex) {
    return knex.schema.createTable('userChooseCategory', function(table){
      table.increments('id').primary();
      table.integer('userId').references('id').inTable('users').onDelete('cascade');
      table.string('categoryId').notNullable();
    })
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('userChooseCategory');
  };