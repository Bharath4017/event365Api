exports.up = function(knex, Promise) {
    return knex.schema.alterTable('payment', function(table){
        table.double('fees')
       
      }).alterTable('events', function(table){
        table.boolean('isExploreEvent').default(false)
    })
    };
    
    exports.down = function(knex, Promise) {
      
    }; 