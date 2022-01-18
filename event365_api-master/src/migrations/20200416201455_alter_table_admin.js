
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('admin', function(table) {
        table.string('device_token');
        table.string('device_type');
    })
};

exports.down = function(knex, Promise) {
  
};
