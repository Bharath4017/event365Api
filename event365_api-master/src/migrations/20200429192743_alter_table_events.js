
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', function(table) {
        
        table.double('adminPayment').defaultTo(0).alter();
    })
    .alterTable('admin',function(table){
        table.double('paymentByHost').defaultTo(0).alter();
    })
};

exports.down = function(knex, Promise) {
    
 
};