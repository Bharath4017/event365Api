
exports.up = function(knex, Promise) {
    return knex.schema.createTable('app_content',function(table){
        table.increments('id').primary();
            table.string('heading').collate('utf8_general_ci');
            table.string('sub_heading').collate('utf8_general_ci');
            table.text('description').collate('utf8_general_ci');
            table.text('sub_description').collate('utf8_general_ci');
            table.string('type');
            table.text('image').collate('utf8_general_ci');
            table.text('icon').collate('utf8_general_ci');
            table.boolean('isActive').defaultTo(true);
            table.integer('created_by');
            table.integer('updated_by');
            table.timestamps(false, false);
    }).createTable('ticket_info',function(table){
        table.increments('id').primary();
        table.integer('userId').unsigned().references('id').inTable('users').onDelete('cascade');
        table.integer('eventId').unsigned().references('id').inTable('events').onDelete('cascade');
            table.string('ticketType').collate('utf8_general_ci');
            table.string('ticketName').collate('utf8_general_ci');
            table.integer('noOfTables');
            table.string('pricePerTable').collate('utf8_general_ci');
            table.integer('totalSeating');
            table.string('description').collate('utf8_general_ci');
            table.integer('parsonPerTable');
            table.integer('totalQuantity');
            table.string('pricePerTicket').collate('utf8_general_ci');
            table.boolean('isActive').defaultTo(true);
            table.integer('created_by');
            table.integer('updated_by');
            table.timestamps(false, false);
    })
  };
  
  exports.down = function(knex, Promise) {
   
  };
  