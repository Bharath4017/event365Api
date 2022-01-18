
exports.up = function(knex, Promise) {
    return knex.schema.createTable('events', function(table) {
        table.increments('id').primary();
        table.integer('userId').references('id').inTable('users').onDelete('cascade');
       // table.integer('galleryId').references('id').inTable('gallery').onDelete('cascade');
        table.integer('eventType').notNullable();
        table.string('name').notNullable();
        table.date('startDate').notNullable()
        table.date('endDate').notNullable();
        table.time('startTime').notNullable();
        table.time('endTime').notNullable();
        table.string('eventVenue').notNullable();
        table.string('latitude').notNullable();
        table.string('longitude').notNullable();
        table.date('deadlineDate').notNullable();
        table.time('deadlineTime').notNullable();
        table.string('paidType').notNullable();
        table.text('additionalInfo');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now()); //table.timestamp('false', 'true');

      })
  };
  
  exports.down = function(knex, Promise) {
    
  };