
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', function(table) {
        // table.renameColumn('countryCode');
         table.string('accountId');
         table.boolean('accountLinkStatus').defaultTo(false);
     })
};

exports.down = function(knex, Promise) {
  
};
