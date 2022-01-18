
exports.up = function(knex, Promise) {
    return knex.schema.createTable('transactionHistory',function(table){
        table.increments('id').primary();
        table.integer('userId').unsigned().references('id').inTable('users').onDelete('cascade');
        table.integer('bankId').unsigned().references('id').inTable('bank_details').onDelete('cascade');
        table.string('withdrawalAmount');
        table.boolean('status').defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
  
};

exports.down = function(knex, Promise) {
  
};
