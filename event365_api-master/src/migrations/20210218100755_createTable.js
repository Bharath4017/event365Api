
exports.up = function(knex, Promise) {
    return knex.schema.createTable('notes', function(table) {
        table.increments('id')
        table.integer('userId').references('id').inTable('admin').onDelete('CASCADE');
        table.string('notes')
        table.boolean('isPrivate').defaultTo(false)
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'))
    }).createTable('sharedNotes', function(table) {
        table.increments('id')
        table.integer('notesId').references('id').inTable('notes').onDelete('CASCADE')
        table.integer('userId').references('id').inTable('admin').onDelete('CASCADE')
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'))
    })
};

exports.down = function(knex, Promise) {
  
};
