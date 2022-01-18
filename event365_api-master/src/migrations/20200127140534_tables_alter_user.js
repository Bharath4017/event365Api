


exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', function(table) {
        table.text('roles').alter();
    })
};

exports.down = function(knex, Promise) {

 
};


