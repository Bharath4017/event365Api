exports.up = function(knex, Promise) {
    return knex.schema.createTable('coupan', function(table) {
        table.increments('id')
        table.integer('eventId')
        table.string('coupanCode')
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'))
    }).alterTable('ticket_info', function(table){
        table.double('discount')
        table.double('discountAmount')
    }).alterTable('events', function(table){
        table.integer('priority')
        table.string('eventUrl')
    }).alterTable('ticketBooked', function(table){
        table.string('cancelledBy')
    })
    };
    
    exports.down = function(knex, Promise) {
      
    };