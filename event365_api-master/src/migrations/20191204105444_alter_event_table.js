
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events',function(table){
        table.string('ticketInfoURL').collate('utf8_general_ci');
        

    })
  
};

exports.down = function(knex, Promise) {
    
 
};
