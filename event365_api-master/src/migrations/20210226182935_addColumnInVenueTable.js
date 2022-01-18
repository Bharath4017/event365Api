
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('venue', function(table) {
        table.integer('createByAdmin').unsigned().references('id').inTable('admin').onDelete('cascade').nullable();
     })
};

exports.down = function(knex, Promise) {
  
};
