
exports.up = function(knex, Promise) {
  
    return knex.schema.createTable('subVenue',function(table){
        table.increments('id').primary();
        table.integer('venueId').unsigned().references('id').inTable('venue').onDelete('cascade');
        table.string('subVenueName');
        table.integer('subVenueCapacity');
      });

};

exports.down = function(knex, Promise) {
  
};
