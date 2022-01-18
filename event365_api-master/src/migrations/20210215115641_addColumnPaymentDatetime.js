
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events', function(table) {
        table.dateTime('paymentDateTime')
    })
};

exports.down = function(knex, Promise) {
  
};
