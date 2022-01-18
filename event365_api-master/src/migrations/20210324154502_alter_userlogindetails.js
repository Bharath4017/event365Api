
exports.up = function (knex, Promise) {
    return knex.schema.alterTable('userLoginDetails', function (table) {
        table.string('deviceId');
    })

};

exports.down = function (knex, Promise) {

};
