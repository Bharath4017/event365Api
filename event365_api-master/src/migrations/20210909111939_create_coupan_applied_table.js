exports.up = function(knex, Promise) {
    return knex.schema.createTable('coupanApplied', function(table) {
        table.increments('id')
        table.integer('eventId')
        table.integer('userId')
        table.string('coupanCode')
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'))
    })
  };
    
    exports.down = function(knex, Promise) {
      
    };