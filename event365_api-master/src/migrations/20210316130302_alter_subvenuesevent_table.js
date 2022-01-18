
exports.up = function (knex, Promise) {

    return knex.schema.alterTable('subVenueEvents', function (table) {
        table.integer('venueEventId').nullable().alter();
    })
};

exports.down = function (knex, Promise) {

};
