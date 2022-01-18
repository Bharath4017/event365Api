
exports.up = function(knex, Promise) {
    return knex.schema.createTable('venueImages',function(table){
        table.increments('id').primary();
        table.integer('venueId').unsigned().references('id').inTable('venue').onDelete('cascade');
        table.string('venueImages');
      })
      .createTable('contactVia',function(table){
        table.increments('id').primary();
        table.integer('venueId').unsigned().references('id').inTable('venue').onDelete('cascade');
        table.string('contactVia');  
      })
};

exports.down = function(knex, Promise) {
  
};
