exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events',function(table){
        table.date('selling_startDate')
        table.date('selling_endDate')
        table.time('selling_startTime')
        table.time('selling_endTime')
    })
  };
  
  exports.down = function(knex, Promise) {
    
  };
  