
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('notes', function(table) {
        table.increments('id')
        table.integer('userId').references('id').inTable('admin').onDelete('CASCADE').alter();
    }).alterTable('sharedNotes', function(table) {
        table.increments('id')
        table.integer('notesId').references('id').inTable('notes').onDelete('CASCADE').alter();
        table.integer('userId').references('id').inTable('admin').onDelete('CASCADE').alter();
    })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('notes').dropTable('sharedNotes')
};
