exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events', function(table) {
       // table.text('roles').alter();
        table.integer('eventType').alter();
        table.string('paidType').alter();
    })
};

exports.down = function(knex, Promise) {

 
};


