exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events',function(table){
        table.renameColumn('selling_startDate', 'sellingStartDate')
        table.renameColumn('selling_endDate', 'sellingEndDate')
        table.renameColumn('selling_startTime', 'sellingStartTime')
        table.renameColumn('selling_endTime','sellingEndTime')
    })
  };
  
  exports.down = function(knex, Promise) {
    
  };
  