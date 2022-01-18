exports.up = function(knex, Promise) {
    return knex.schema.createTable('favorite',function(table){
        table.increments('id').primary();
        table.integer('userId').unsigned().references('id').inTable('users').onDelete('cascade');
        table.integer('eventId').unsigned().references('id').inTable('events').onDelete('cascade');
        table.boolean('isFavorite').defaultTo(false);
  
    })
  };
  
  exports.down = function(knex, Promise) {
    
  };
