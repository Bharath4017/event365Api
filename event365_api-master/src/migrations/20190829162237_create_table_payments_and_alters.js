
exports.up = function(knex, Promise) {
  return knex.schema.createTable('normalTicket',function(table){
      table.increments('id').primary();
      table.integer('userId').unsigned().references('id').inTable('users').onDelete('cascade');;
      table.integer('eventId').unsigned().references('id').inTable('events').onDelete('cascade');;
      table.string('ticketType')
      table.string('ticketName');
      table.string('pricePerTicket');
      table.integer('totalQuantity');
      table.text('description');
  }).createTable('tableSeatingTicket',function(table){
      table.increments('id').primary();
      table.integer('userId').unsigned().references('id').inTable('users').onDelete('cascade');;
      table.integer('eventId').unsigned().references('id').inTable('events').onDelete('cascade');;
      table.string('ticketType');
      table.string('categoryName');
      table.string('noOfTables');
      table.string('pricePerTable');
      table.string('totalSeating');
      table.text('description');
  }).alterTable('venue',function(table){
      table.dropColumn('userType');
      table.integer('userId').unsigned().references('id').inTable('users').onDelete('cascade');
  })
};

exports.down = function(knex, Promise) {
    
};
