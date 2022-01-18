exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', function(table) {
       
        table.double('currentAmount').defaultTo(0).alter();
        table.double('currentAmount').defaultTo(0).alter();
    })
};

exports.down = function(knex, Promise) {

 
};


