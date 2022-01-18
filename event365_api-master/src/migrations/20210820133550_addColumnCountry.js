
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('venueEvents', function(table){
        table.string('country');
    })
};

exports.down = function(knex, Promise) {
  
};
