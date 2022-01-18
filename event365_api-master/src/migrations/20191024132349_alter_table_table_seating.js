
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('tableSeatingTicket', function(table) {
        table.integer('parsonPerTable');
    })
};

exports.down = function(knex, Promise) {
    
 
};
