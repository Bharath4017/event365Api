
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', function(table) {
        table.string('socailUserId');
        table.string('loginType');
  
    }).alterTable('ticketBooked',function(table){
        table.string('parsonPerTable');
        table.dropColumn('pricePerTable');
        
    })
    .dropTable("vipTicketBooked")
    .dropTable("regularTicketBooked")
    .dropTable("eventUsers")
    .dropTable("nonRegistedVenue")
    .dropTable("freeTicketBooked");
  
};

exports.down = function(knex, Promise) {
    return knex.schema
    
 
};
