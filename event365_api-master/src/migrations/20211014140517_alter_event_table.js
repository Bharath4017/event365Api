exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events', function(table){
        table.string('paidEventStatus', 255)
        table.string('amount', 100)
     }).alterTable('slider', function(table){
        table.boolean('status').default(true)
     }).alterTable('venueEvents', function(table){
        table.string('fullState',255)
     }).alterTable('venue', function(table){
      table.string('fullState',255)
   })
    };
    
exports.down = function(knex, Promise) {
      
    }; 
