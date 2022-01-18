
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('reviews',function(table){
        table.integer('eventId');
       
    });
  };
  
  exports.down = function(knex, Promise) {
    
  };
  