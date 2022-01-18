
exports.up = function(knex, Promise) {
    return knex.schema.createTable('ticketNumber', function(table) {
        table.increments('id')
        table.integer('ticketId').references('id').inTable('ticket_info').onDelete('CASCADE');
        table.string('ticketNumber').unique().nullable()
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'))
    }).alterTable('ticket_info', function(table) {
        table.timestamp('created_at').defaultTo(knex.fn.now()).alter();
    })
};

exports.down = function(knex, Promise) {
  
};
