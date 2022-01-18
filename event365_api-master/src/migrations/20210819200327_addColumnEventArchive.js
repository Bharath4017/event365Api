
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events', function(table){
        table.boolean('isArchived').default(false);
    })
};

exports.down = function(knex, Promise) {
  
};
