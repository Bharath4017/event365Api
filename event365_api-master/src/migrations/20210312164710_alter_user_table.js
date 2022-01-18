
exports.up = function (knex, Promise) {

    return knex.schema.table('users', function (table) {
        table.string('countryName').nullable();
    }).alterTable('ticketBooked', function (table) {
        table.string('invoiceNumber').nullable();
    })
};

exports.down = function (knex, Promise) {

};
