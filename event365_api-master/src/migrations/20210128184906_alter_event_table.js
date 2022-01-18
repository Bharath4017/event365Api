
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events', function(table) {
        table.boolean('oneHourNotifyStatus').defaultTo(false);
        table.boolean('oneDayNotifyStatus').defaultTo(false);
    })
};
exports.down = function(knex, Promise) {
  
};
