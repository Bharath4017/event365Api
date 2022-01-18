
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('ticketBooked',function(table){
        table.integer('ticketId').unsigned().references('id').inTable('ticket_info').onDelete('cascade');
        

    })
  
};

exports.down = function(knex, Promise) {
    
 
};
