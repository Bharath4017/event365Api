
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('ticket_info', function(table) {
       table.integer('cancellationChargeInPer').defaultTo(0);
    })
};

exports.down = function(knex, Promise) {
  
};
