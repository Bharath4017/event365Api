
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('venue', function(table){
        table.integer('reservedByUser').unsigned().references('id').inTable('users').onDelete('cascade');
    })
};

exports.down = function(knex, Promise) {
  
};
