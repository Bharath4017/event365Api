
exports.up = function(knex, Promise) {
  return knex.schema.createTable('eventOccurrence',function(table){
      table.increments('id').primary();
      table.integer('eventId').unsigned().references('id').inTable('events').onDelete('cascade');
      table.string('eventOccurrence');
      table.integer('occurredOn');
  })
};

exports.down = function(knex, Promise) {
  
};
