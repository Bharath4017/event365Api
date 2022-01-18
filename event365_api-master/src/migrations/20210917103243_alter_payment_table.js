exports.up = function(knex, Promise) {
    return knex.schema.alterTable('payment', function(table){
        table.double('fees').default(0).alter()
       
      }).alterTable('ticket_info', function(table){
        table.double('discount').default(0).alter()
    })
    };
    
    exports.down = function(knex, Promise) {
      
    }; 