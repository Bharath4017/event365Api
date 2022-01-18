
exports.up = function(knex, Promise) {
   return knex.schema.createTable('notes', function(table) {
        table.integer('userId')
        table.string('notes')
        table.boolean('isPrivate').defaultTo(false)
        table.timestamp('created_at')
        table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'))
    }).createTable('sharedNotes', function(table) {
        table.integer('notesId')
        table.integer('userId')
        table.timestamp('created_at')
        table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'))
    })
};

exports.down = function(knex, Promise) {
  
};
