
exports.up = function(knex, Promise) {
    return knex.schema.createTable('admin',function(table){
        table.increments('id').primary();
        table.string('first_name', 60).collate('utf8_general_ci');
            table.string('last_name', 60).collate('utf8_general_ci');
            table.string('email_id', 60).unique().collate('utf8_general_ci');
            table.string('mobile_number').collate('utf8_general_ci');
            table.string('password').collate('utf8_general_ci');
            table.text('profile_image').collate('utf8_general_ci');
            table.text('token').collate('utf8_general_ci');
            table.text('verification').collate('utf8_general_ci').comment('it will store verification otp for drivers and link for others.');
            table.enum('user_type', ['super_admin', 'customer']).collate('utf8_general_ci').comment('This defines users type');;
            table.enum('user_status', ['active', 'pending', 'block']).defaultTo('pending');
            table.string('ip');
            table.string('user_address', 100).collate('utf8_general_ci');
            table.boolean('is_email_verified').defaultTo(false);
            table.integer('created_by');
            table.integer('updated_by');
            table.timestamps(false, false);
            table.timestamp('last_login_at', true);
    })
};

exports.down = function(knex, Promise) {

};

