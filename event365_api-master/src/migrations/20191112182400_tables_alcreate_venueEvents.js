
exports.up = function(knex, Promise) {
    return knex.schema.createTable('venueEvents',function(table){
        table.increments('id').primary();
        table.integer('venueId').unsigned().references('id').inTable('venue').onDelete('cascade');
        table.integer('userId').unsigned().references('id').inTable('users').onDelete('cascade');
        table.integer('eventId').unsigned().references('id').inTable('events').onDelete('cascade');
        
        table.string('venueAddress');
        table.string('venueName');
        table.string('latitude');
        table.string('longitude');
        table.string('venueType');
        table.string('venueStatus');

    })
  };
  
  exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('paidRegularRSVP').dropTableIfExists('freeRSVP');
  };
  