
exports.up = function(knex, Promise) {
  return knex.schema.dropTable('sharedNotes').dropTable('notes')
};

exports.down = function(knex, Promise) {
  
};
