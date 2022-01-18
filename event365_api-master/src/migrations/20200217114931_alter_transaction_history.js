
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('transactionHistory', function(table) {
        table.dropColumn('withdrawalAmount');
        table.double('withdrawnAmount').defaultTo(0);
        table.string('transStatus');
    })
};

exports.down = function(knex, Promise) {

 
};


