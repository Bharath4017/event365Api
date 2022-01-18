
exports.up = function(knex, Promise) {
    return knex.schema.createTable('notification',function(table){
        table.increments('id').primary();
        table.integer('eventId')
        table.integer('userId')
        table.string('type');
        table.string('msg');
        table.string('status');
        table.boolean('active').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
  
};

exports.down = function(knex, Promise) {
  
};
