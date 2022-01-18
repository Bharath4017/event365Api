
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', function(table) {
       
        table.integer('phoneOTP');
    })
};

exports.down = function(knex, Promise) {

 
};


