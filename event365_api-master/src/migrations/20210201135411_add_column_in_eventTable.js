
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events', function(table) {
        // table.renameColumn('countryCode');
        table.string('hostMobile');
        table.string('hostAddress');
        table.string('websiteUrl');
        table.string('paymentDetail');
    }).alterTable('users', function(table){
        table.integer('wrongPassAttemptCount').defaultTo(0)
    })
};

exports.down = function(knex, Promise) {
  
};
