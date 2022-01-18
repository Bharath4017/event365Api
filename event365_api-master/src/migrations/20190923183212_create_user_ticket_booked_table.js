
exports.up = function(knex, Promise) {
    return knex.schema.createTable('ticketBooked',function(table){
        table.increments('id').primary();
        table.integer('userId').unsigned().references('id').inTable('users').onDelete('cascade');
        table.integer('eventId').unsigned().references('id').inTable('events').onDelete('cascade');
        table.string('status');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    }).createTable('freeTicketBooked',function(table){
        table.increments('id').primary();
        table.integer('ticketId').unsigned().references('id').inTable('ticketBooked').onDelete('cascade');
        table.integer('freeNormalTicketCount');
        table.string('status');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    }).createTable('vipTicketBooked',function(table){
      table.increments('id').primary();
      table.integer('ticketId').unsigned().references('id').inTable('ticketBooked').onDelete('cascade');
      table.integer('vipNormalTicketCount');
      table.integer('vipTableSeatingTicketCount');
      table.string('status');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
  }).createTable('regularTicketBooked',function(table){
    table.increments('id').primary();
    table.integer('ticketId').unsigned().references('id').inTable('ticketBooked').onDelete('cascade');
    table.integer('regularNormalTicketCount');
    table.integer('regularTableSeatingTicketCount');
    table.string('status');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  })
  };
  
  exports.down = function(knex, Promise) {
    
  };
  