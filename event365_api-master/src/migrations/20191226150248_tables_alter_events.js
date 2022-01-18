exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events',function(table){
        table.timestamp('sellingStart').defaultTo(knex.fn.now());
        table.timestamp('sellingEnd').defaultTo(knex.fn.now());
        table.timestamp('start').defaultTo(knex.fn.now());
        table.timestamp('end').defaultTo(knex.fn.now());
    })
  };
  
  exports.down = function(knex, Promise) {
    
  };
  