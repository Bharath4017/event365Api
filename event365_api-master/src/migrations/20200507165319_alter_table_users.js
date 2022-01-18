
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', function(table) {
        
        table.string('profilePic').defaultTo("").alter();
    })
    
};

exports.down = function(knex, Promise) {
    
 
};