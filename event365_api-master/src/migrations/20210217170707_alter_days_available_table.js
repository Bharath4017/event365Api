
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('daysAvailable', function(table) {
        table.time('fromTime')
        table.time('toTime');
     })
};

exports.down = function(knex, Promise) {
  
};
