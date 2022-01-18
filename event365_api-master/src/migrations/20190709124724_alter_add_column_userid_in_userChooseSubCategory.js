
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('userChooseSubcategory', function(table) {
        table.string('userId');
    });
};

exports.down = function(knex, Promise) {
  
};
