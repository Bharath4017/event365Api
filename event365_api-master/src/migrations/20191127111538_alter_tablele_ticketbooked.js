
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('ticketBooked',function(table){
        table.string('pricePerTicket').collate('utf8_general_ci');
        

    })
  
};

exports.down = function(knex, Promise) {
    
 
};
