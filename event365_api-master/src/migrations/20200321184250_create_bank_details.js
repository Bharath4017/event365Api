
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('bank_details', function(table) {
       
        table.string('bankIdKey');
    })
};

exports.down = function(knex, Promise) {

 
};


