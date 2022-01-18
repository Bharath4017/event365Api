
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events',function(table){
        table.renameColumn('additionalInfo','description');
    })
};

exports.down = function(knex, Promise) {
  
};
