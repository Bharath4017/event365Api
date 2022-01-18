
exports.up = function(knex) {
    return knex.schema.alterTable('category', function(table) {
        table.integer('catCount');
      })
};

exports.down = function(knex) {
  
};
