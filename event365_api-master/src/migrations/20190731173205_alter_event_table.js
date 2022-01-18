
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events', function(table) {
        table.integer('reviewCount');
        table.boolean('isReviewed');
        table.boolean('isfavourite');
        table.float('rating');

    })
  };

exports.down = function(knex, Promise) {

};
