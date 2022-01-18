
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events', function(table) {
        table.integer('userLikeCount').defaultTo(0);
        table.integer('userDisLikeCount').defaultTo(0);

    })
  };

exports.down = function(knex, Promise) {

};
