
exports.up = function(knex, Promise) {
    return knex.schema.createTable('paidEventPrice',function(table){
        table.increments('id').primary();
        //table.integer('userId').unsigned().references('id').inTable('users').onDelete('cascade');
        table.string('ruleForPartner', 10);
        table.integer('minValue');
        table.integer('maxValue');
        table.double('amount');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
};

exports.down = function(knex, Promise) {
  
};
