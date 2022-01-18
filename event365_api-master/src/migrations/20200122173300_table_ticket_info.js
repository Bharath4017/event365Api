
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('ticket_info', function(table) {
        table.float('discountedPrice');
        table.float('disPercentage');
    })
};

exports.down = function(knex, Promise) {

 
};


