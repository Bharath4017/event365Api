exports.up = function(knex, Promise) {
    return knex.schema.alterTable('userLoginDetails', function(table){
        table.string('userType', 255)
     })
    };
    
exports.down = function(knex, Promise) {
      
    }; 
