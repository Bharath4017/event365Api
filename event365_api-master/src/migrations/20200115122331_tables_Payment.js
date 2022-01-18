
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('payment',function(table){
        table.increments('id').primary();
    })
};

exports.down = function(knex, Promise) {
  
};

