
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events', function(table) {
        table.string('totalPayment');
    }).alterTable('admin',function(table){
        table.string('paymentByHost');
    })
    .alterTable('users',function(table){
        table.string('adminPayment');
    })
};

exports.down = function(knex, Promise) {
    
 
};