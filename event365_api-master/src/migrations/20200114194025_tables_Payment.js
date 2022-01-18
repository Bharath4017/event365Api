
exports.up = function(knex, Promise) {
    return knex.schema.createTable('payment',function(table){
        table.integer('id');
        table.integer('bookedId');
        table.string('amount');
        table.string('currency');
        table.string('status');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
  };
  
  exports.down = function(knex, Promise) {
    
  };
  