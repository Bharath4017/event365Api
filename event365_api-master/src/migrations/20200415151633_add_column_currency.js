
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', function(table) {
        // table.renameColumn('countryCode');
         table.string('currencyCode');
    })
};

exports.down = function(knex, Promise) {
  
};
