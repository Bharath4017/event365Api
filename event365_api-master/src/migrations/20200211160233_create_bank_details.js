exports.up = function(knex, Promise) {
    return knex.schema.alterTable('bank_details', function(table) {
       
        table.string('routingNo');
    })
};

exports.down = function(knex, Promise) {

 
};


