
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('ticketBooked',function(table){
        table.string('pricePerTable');
        

    })
  
};

exports.down = function(knex, Promise) {
    
 
};
