exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', function(table) {
       
        table.double('currentAmount').alter();
        table.double('totalAmount').alter();
    })
};

exports.down = function(knex, Promise) {

 
};


