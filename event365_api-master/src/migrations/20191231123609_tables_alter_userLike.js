
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('userLikes',function(table){
        table.integer('userLikeCount');
        table.integer('userDisLikeCount');
        table.integer('reviewCount');
        table.decimal('rating');
        table.integer('created_by');
        table.integer('updated_by');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
  };
  
  exports.down = function(knex, Promise) {
    
  };
  