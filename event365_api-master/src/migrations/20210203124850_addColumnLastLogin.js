
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', function(table) {
        // table.renameColumn('countryCode');
        table.datetime('lastLoginTime').defaultTo(knex.fn.now());
    })
};

exports.down = function(knex, Promise) {
  
};
