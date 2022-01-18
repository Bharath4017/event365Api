
exports.up = function (knex, Promise) {

    return knex.schema.alterTable('subVenueEvents', function (table) {
        table.integer('eventId').nullable().references('id').inTable('events').onDelete('CASCADE');
    })

};

exports.down = function (knex, Promise) {

};
