
exports.up = function(knex, Promise) {
    return knex.schema.createTable('freeRSVP',function(table){
        table.increments('id').primary();
        table.integer('eventId').references('id').inTable('events').onDelete('cascade');
        table.string('freeTicketName');
        table.string('freeTicketQuantity');
    }).createTable('paidRSVP',function(table){
        table.increments('id').primary();
        table.integer('eventId').references('id').inTable('events').onDelete('cascade');
        table.string('paidTicketName');
        table.integer('pricePerTicket');
        table.integer('paidTicketQuantity');
        table.string('seatingCategoryName');
        table.integer('noOfTables');
        table.integer('pricePerTable');
        table.integer('totalSeating');
  
    })
  };
  
  exports.down = function(knex, Promise) {
    
  };
  