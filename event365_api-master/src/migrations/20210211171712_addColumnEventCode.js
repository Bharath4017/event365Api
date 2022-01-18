
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events', function(table) {
        table.string('eventCode', 10)
    }).alterTable('ticket_info', function(table){
        table.string('ticketNumber', 10)  
    })
};

exports.down = function(knex, Promise) {
  
};
