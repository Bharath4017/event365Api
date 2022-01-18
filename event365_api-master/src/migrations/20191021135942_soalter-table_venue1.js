
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('venue', function(table) {
        table.renameColumn('address', 'venueAddress')
    }).alterTable('nonRegisteredVenue',function(table){
        table.string('venueName');
    })
};

exports.down = function(knex, Promise) {
    
 
};
