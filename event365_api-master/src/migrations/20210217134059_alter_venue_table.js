
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('venue', function(table) {
        table.string('venueType')
        table.string('shortDescription');
     })
};

exports.down = function(knex, Promise) {
  
};
