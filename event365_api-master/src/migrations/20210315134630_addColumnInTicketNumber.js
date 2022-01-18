
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('ticketNumber', function(table) {
        table.integer('ticketBookedId').references('id').inTable('ticketBooked').onDelete('CASCADE');
        table.string('status',20)
    })
};

exports.down = function(knex, Promise) {
  
};
