exports.up = function(knex, Promise) {
    return knex.schema.createTable('galleryImages', function(table){
        table.increments('id').primary();
        table.integer('eventId').references('id').inTable('events').onDelete('cascade');
        table.string('eventImage');
    })
  };
  
  exports.down = function(knex, Promise) {
    
  };
