
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('venue', function(table){
        table.string('country');
    })
};

exports.down = function(knex, Promise) {
  
};
