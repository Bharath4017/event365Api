
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('venue', function(table) {
        table.integer('eventId').unsigned().references('id').inTable('events').onDelete('cascade');
    })
};

exports.down = function(knex, Promise) {
    
 
};
