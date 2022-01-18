
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('events', function(table) {
    // table.renameColumn('countryCode');
    table.double('MinPaidAmount');
  })
};

exports.down = function(knex, Promise) {
  
};
