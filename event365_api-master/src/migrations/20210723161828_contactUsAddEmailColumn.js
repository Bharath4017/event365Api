
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('contactUs', table => {
        table.string('email');
    });
};

exports.down = function(knex, Promise) {
  
};
