
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('venue', function(table) {
        table.boolean('isVenueAvailableToOtherHosts').defaultTo(false)
     })
};

exports.down = function(knex, Promise) {
  
};
