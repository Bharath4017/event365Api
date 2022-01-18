
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('payment',function(table){
        table.string('paymentId');
    })
};

exports.down = function(knex, Promise) {
  
};

