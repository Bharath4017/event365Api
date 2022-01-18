

exports.up = function(knex, Promise) {
    return knex.schema.alterTable('ticket_info', function(table) {
        table.float('pricePerTicket').alter();
    })
    .dropTable("nonRegisteredVenue")
    .dropTable("normalTicket")
    .dropTable("tableSeatingTicket")

  
};

exports.down = function(knex, Promise) {

 
};

