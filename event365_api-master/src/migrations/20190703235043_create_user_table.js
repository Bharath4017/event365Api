
exports.up = function(knex) {
   return knex.schema.createTable('users', function (table) {

        table.increments().primary();
        table.string('name').notNullable();
        table.string('email').notNullable();
        table.string('password').notNullable();
        table.integer('userType').notNullable();

        table.integer('isPhoneVerified').default(0);
        table.integer('isEmailVerified').defaultTo(0);
        table.integer('isAdminVerified');
        table.text('deviceToken');
        table.integer('deviceId');
        table.string('deviceType');

        table.integer('countryCode');
        table.string('phoneNo');
        table.string('address');
        table.string('city');
        table.string('state');
        table.string('zip');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now()); //table.timestamp('false', 'true');

    })
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('users');
};
