exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events', function(table){
        table.string('archivedBy')
     })
    };
    
exports.down = function(knex, Promise) {
      
    }; 
