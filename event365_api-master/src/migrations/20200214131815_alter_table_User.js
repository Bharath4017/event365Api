exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', function(table) {
       
        table.double('totalAmount');
    })
};

exports.down = function(knex, Promise) {

 
};


