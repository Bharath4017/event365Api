
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('category', function(table){
        table.integer('searchCount').default(0);
    })
};

exports.down = function(knex, Promise) {
  
};
