
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('ticketBooked',function(table){
        table.integer('totalQuantity');
        

    })
  
};

exports.down = function(knex, Promise) {
    
 
};
