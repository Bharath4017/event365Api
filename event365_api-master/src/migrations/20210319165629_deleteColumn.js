
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('ticketNumber', function(table){
        table.dropColumn('ticketId')
        table.dropColumn('rt_id')
        table.integer('refundId').nullable
    })
};

exports.down = function(knex, Promise) {
  
};
