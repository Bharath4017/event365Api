
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events', function(table){
        table.boolean('isDeleted').default(false);
    })
};

exports.down = function(knex, Promise) {
  
};
