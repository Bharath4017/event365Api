
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('userLoginDetails', function(table) {
        table.string('deviceType', 20)
    })
};

exports.down = function(knex, Promise) {
  
};
