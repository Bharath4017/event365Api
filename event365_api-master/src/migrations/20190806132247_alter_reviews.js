
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('reviews', function(table) {
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

    })
  };

exports.down = function(knex, Promise) {

};
