
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('ticket_info',function(table){
        table.boolean('isTicketDisabled').defaultTo(false);
        table.dropColumn('isActive');
    })
};

exports.down = function(knex, Promise) {
  
};
