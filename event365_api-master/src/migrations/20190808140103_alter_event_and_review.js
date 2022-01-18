
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('events',function(table){
      table.dropColumn('isReviewed');
  }).alterTable('reviews',function(table){
      table.decimal('reviewStar').alter();
  })
};

exports.down = function(knex, Promise) {
  
};
