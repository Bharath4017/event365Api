
exports.up = function(knex, Promise) {
    return knex.schema.createTable('bank_details',function(table){
        table.increments('id').primary();
        table.integer('userId').unsigned().references('id').inTable('users').onDelete('cascade');
        table.string('beneficiaryName');
        table.string('AccountNo');
        table.string('ABANo');
        table.string('bankName');
        table.string('bankAdd');
        table.string('ifscCode');
        table.string('createdBy');
        table.boolean('active').defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
  
};

exports.down = function(knex, Promise) {
  
};
