
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events',function(table){
        table.string('eventHelpLine');
    })
};

exports.down = function(knex, Promise) {
  
};

