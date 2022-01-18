
exports.up = function(knex, Promise) {
    return knex.schema.createTable('eventOtherImages', function(table) {
        table.increments('id')
        table.integer('eventId').references('id').inTable('events').onDelete('CASCADE')
        table.string('image')
        table.enum('imageType', ['talents', 'sponser'])
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'))
    })
};

exports.down = function(knex, Promise) {
  
};
