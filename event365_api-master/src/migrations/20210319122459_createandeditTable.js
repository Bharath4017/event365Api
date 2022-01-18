
exports.up = function(knex, Promise) {
  return knex.schema.createTable('refundTransaction', function(table){
    table.increments('id')
    table.double('amount')
    table.string('rf_id')
    table.string('status', 20)
    table.integer('paymentId').references('id').inTable('payment').onDelete('CASCADE')
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'))
  }).alterTable('ticketNumber', function(table){
    table.integer('rt_id').references('id').inTable('payment').nullable()
  }).alterTable('payment', function(table){
    table.double('balanceAmount')
  })
};

exports.down = function(knex, Promise) {
  
};
