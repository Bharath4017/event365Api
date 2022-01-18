

exports.up = function(knex, Promise) {
    return knex.schema.alterTable('ticket_info', function(table) {
        table.integer('actualQuantity');
    })
};

exports.down = function(knex, Promise) {

 
};

