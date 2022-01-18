
exports.up = function (knex, Promise) {
    return knex.schema.alterTable('users', function (table) {
        table.string('deviceId').alter();
    })
};

exports.down = function (knex, Promise) {

};
