
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('payment',function(table){
        table.dropColumn('id');
    })
};

exports.down = function(knex, Promise) {
  
};
