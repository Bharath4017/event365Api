
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', function(table) {
        table.dropColumn('currentAmount');
        table.double('currentAmounts').defaultTo(0);
    })
};

exports.down = function(knex, Promise) {

 
};


