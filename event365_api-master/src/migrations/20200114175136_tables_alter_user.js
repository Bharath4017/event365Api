
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users',function(table){
        table.string('customerId');
    })
};

exports.down = function(knex, Promise) {
  
};
