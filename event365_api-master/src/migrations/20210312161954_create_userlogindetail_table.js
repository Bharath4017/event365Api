
exports.up = function (knex, Promise) {

    return knex.schema.createTable('userLoginDetails', function (table) {
        table.increments('id')
        table.integer('userId').references('id').inTable('users').onDelete('CASCADE');
        table.timestamp('signInTime').defaultTo(knex.fn.now())
        table.timestamp('signOutTime').defaultTo(knex.raw('CURRENT_TIMESTAMP'))
        table.string('sourceIp').nullable()
        table.string('loginType').nullable()
        table.string('status').nullable()
        table.string('currentStatus').nullable()
        table.string('browser').nullable()
        table.string('OS').nullable()
        table.string('platform').nullable()
    })

};

exports.down = function (knex, Promise) {

};
