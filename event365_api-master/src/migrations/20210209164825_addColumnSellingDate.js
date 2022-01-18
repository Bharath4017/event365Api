
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('ticket_info', function(table) {
        table.date('sellingStartDate')
        table.date('sellingEndDate')
        table.time('sellingStartTime')
        table.time('sellingEndTime');
     })
};

exports.down = function(knex, Promise) {
  
};
