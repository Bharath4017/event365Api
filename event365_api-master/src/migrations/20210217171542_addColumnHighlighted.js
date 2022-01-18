
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('events', function(table) {
        table.boolean('isHighLighted').defaultTo(false)
  })
};

exports.down = function(knex, Promise) {
  
};
