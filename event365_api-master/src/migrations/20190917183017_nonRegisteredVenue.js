
exports.up = function(knex, Promise) {
  return knex.schema.createTable('nonRegistedVenue',function(table){
      table.increments('id').primary();
      table.integer('userId').unsigned().references('id').inTable('users').onDelete('cascade');table.integer('eventId').unsigned().references('id').inTable('events').onDelete('cascade');
      table.string('venueAddress');
      table.string('latitude');
      table.string('longitude');
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('paidRegularRSVP').dropTableIfExists('freeRSVP');
};
