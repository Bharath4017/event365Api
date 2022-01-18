
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('userChooseSubcategory', function(table) {
        table.boolean('is_active').defaultTo(true);
        table.integer('eventId').unsigned().references('id').inTable('events').onDelete('cascade');
       
    }).alterTable('events', function(table) {
        table.string('description2');
    })
};  


exports.down = function(knex, Promise) {
    
};


