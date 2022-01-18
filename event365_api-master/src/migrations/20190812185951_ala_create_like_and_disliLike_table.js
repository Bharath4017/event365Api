
exports.up = function(knex, Promise) {
    return knex.schema.createTable('userLikes',function(table){
        table.increments('id').primary();
        table.integer('userId').unsigned().references('id').inTable('users').onDelete('cascade');
        table.integer('eventId').unsigned().references('id').inTable('events').onDelete('cascade');
        table.boolean('isLike').defaultTo(false);
        table.boolean('isDisLike').defaultTo(false);
  
    })
  };
  
  exports.down = function(knex, Promise) {
    
  };
  