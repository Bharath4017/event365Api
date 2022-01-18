
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('notification', function(table) {
        table.string('body');
        table.string('title');
    }).alterTable('admin',function(table){
        table.boolean('has_new_alerts').defaultTo(true);
    })
};

exports.down = function(knex, Promise) {
    
 
};