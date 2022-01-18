
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('contactVia',function(table){
        table.integer('userId').unsigned().references('id').inTable('users').onDelete('cascade');
        table.boolean('isContactVia').defaultTo(true);
    })
  
  };
  
  exports.down = function(knex, Promise) {
    return knex.schema
    .dropTable("paidRegularRSVP")
    .dropTable("freeRSVP");
  
  };
  