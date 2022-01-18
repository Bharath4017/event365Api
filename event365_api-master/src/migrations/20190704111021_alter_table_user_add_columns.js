
exports.up = function(knex) {
    return knex.schema.alterTable('users', function(table) {
        table.string('profilePic');
        table.string('shortInfo');
        table.string('URL');
        table.string('userLatitude');
        table.string('userLongitude');
      })
};

exports.down = function(knex) {
  
};
