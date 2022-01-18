
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('venue', function(table) {
        table.integer('venueCapacity')
        table.integer('allotedTicket')
        table.integer('ticketCapacityPercent')
    })
};

exports.down = function(knex, Promise) {
  
};
