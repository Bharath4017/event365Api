
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('userLoginDetails', function(table){
        table.text('deviceToken').alter();
        table.text('authToken').alter();
    })
};

exports.down = function(knex, Promise) {
  
};
