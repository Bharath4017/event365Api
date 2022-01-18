
exports.up = function(knex, Promise) {
        return knex.schema.alterTable('venue', function(table) {
            table.integer('isActive');
            table.integer('userType');

        })
      };

exports.down = function(knex, Promise) {
  
};
