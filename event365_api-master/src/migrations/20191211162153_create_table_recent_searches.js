
exports.up = function(knex, Promise) {
        return knex.schema.createTable('recentSearch',function(table){
            table.increments('id').primary();
            table.integer('userId').unsigned().references('id').inTable('users').onDelete('cascade');
            table.integer('eventId');
            table.string('text');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        })
};

exports.down = function(knex, Promise) {
  
};
