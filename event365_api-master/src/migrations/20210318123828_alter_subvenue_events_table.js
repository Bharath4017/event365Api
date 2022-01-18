
exports.up = function (knex, Promise) {
    return knex.schema.alterTable('subVenueEvents', function (table) {
        table.integer('userId').nullable().references('id').inTable('users').onDelete('CASCADE');
    })
};
exports.down = function (knex, Promise) {

};
