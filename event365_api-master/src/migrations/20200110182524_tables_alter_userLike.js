
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('notification',function(table){
        table.string('readstatus');
    })
};

exports.down = function(knex, Promise) {
  
};
