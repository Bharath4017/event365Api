exports.up = function(knex, Promise) {
return knex.schema.createTable('notice', function(table) {
    table.increments('id')
    table.string('bg_color')
    table.string('text')
    table.string('text_color')
    table.string('url')
    table.boolean('isActive').default(false);
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'))
}).createTable('slider', function(table) {
    table.increments('id')
    table.string('image')
    table.integer('time')
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'))
}).alterTable('payment', function(table){
    table.enum('paymentType', ['stripe', 'paypal'])
}).alterTable('category', function(table){
    table.dropColumn('catCount')
}).alterTable('events', function(table){
    table.string('otherWebsiteUrl')
})
};

exports.down = function(knex, Promise) {
  
};