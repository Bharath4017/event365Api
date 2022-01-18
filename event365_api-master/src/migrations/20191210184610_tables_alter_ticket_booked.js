
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('ticketBooked',function(table){
        table.integer('createdBy');
        

    })
  
};

exports.down = function(knex, Promise) {
    
 
};
