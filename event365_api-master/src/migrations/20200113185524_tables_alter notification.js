
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('notification',function(table){
        table.dropColumn('readStatus');
        table.boolean('readstatus').defaultTo(false);
    })
};

exports.down = function(knex, Promise) {
  
};
