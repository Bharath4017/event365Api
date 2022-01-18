
exports.up = function (knex, Promise) {
    return knex.schema.createTable('subVenueEvents', function (table) {
        table.increments('id')
        table.integer('venueEventId').references('id').inTable('venueEvents').onDelete('CASCADE');
        table.integer('venueId').references('id').inTable('venue').onDelete('CASCADE');
        table.integer('subVenueId').references('id').inTable('subVenue').onDelete('CASCADE');
        table.string('status');
        table.datetime('reserveTime');
    })
};

exports.down = function (knex, Promise) {

};
