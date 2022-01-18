
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('ticketBooked', function(table) {
        table.string('ticketType');
    })
};

exports.down = function(knex, Promise) {
  
};
