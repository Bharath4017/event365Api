


exports.up = function(knex, Promise) {
    return knex.schema.alterTable('ticket_info', function(table) {
        table.float('pricePerTable').alter();
    })
};

exports.down = function(knex, Promise) {

 
};


