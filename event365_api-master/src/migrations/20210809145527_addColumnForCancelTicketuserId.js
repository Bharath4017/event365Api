
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('ticketNumber', function(table){
        table.enum('cancelledBy', ['user', 'partner']);
    })
};

exports.down = function(knex, Promise) {
  
};
