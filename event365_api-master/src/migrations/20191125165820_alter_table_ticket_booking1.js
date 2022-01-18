
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('ticketBooked',function(table){
        table.string('QRkey');
        

    })
  
};

exports.down = function(knex, Promise) {
    
 
};
