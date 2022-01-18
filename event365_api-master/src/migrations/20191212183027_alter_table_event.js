
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events', function(table) {
        table.boolean('is_active').defaultTo(false);
        //table.renameColumn('address', 'venueAddress')
    }).alterTable('users',function(table){
       
        table.boolean('is_active').defaultTo(false);
    }).alterTable('venue',function(table){
       
        table.boolean('is_active').defaultTo(false);
    })
};

exports.down = function(knex, Promise) {
    
 
};
