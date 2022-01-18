
exports.up = function (knex, Promise) {

    return knex.schema.createTable('contactUs', table => {
        table.increments('id').primary();
        table.integer('userId');
        table.string('issue');
        table.string('message');
    });
};

exports.down = function (knex, Promise) {

};
