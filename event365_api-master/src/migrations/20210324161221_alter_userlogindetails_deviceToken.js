
exports.up = function (knex, Promise) {
    return knex.schema.alterTable('userLoginDetails', function (table) {
        table.string('deviceToken');
    })
};

exports.down = function (knex, Promise) {

};
