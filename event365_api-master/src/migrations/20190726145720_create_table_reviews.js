
exports.up = function(knex, Promise) {
  return knex.schema.createTable('reviews',function(table){
      table.increments('id').primary();
      table.integer('userId').unsigned().references('id').inTable('users').onDelete('cascade');
      table.integer('reviewStar');
      table.string('reviewText');

  })
};

exports.down = function(knex, Promise) {
  
};
