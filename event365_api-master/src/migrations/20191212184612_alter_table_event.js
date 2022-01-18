
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events', function(table) {
        table.boolean('is_availability').defaultTo(true);
      //  table.renameColumn('address', 'venueAddress')
    })
};

exports.down = function(knex, Promise) {
    
 
};
