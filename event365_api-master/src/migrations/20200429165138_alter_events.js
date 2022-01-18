
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events', function(table) {
        
        table.double('totalPayment').defaultTo(0).alter();
    })
};

exports.down = function(knex, Promise) {
    
 
};