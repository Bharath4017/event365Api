
exports.up = function(knex) {
    return knex.schema.alterTable('events', function(table){
        table.string('countryCode');
    })
};

exports.down = function(knex) {
  
};
 