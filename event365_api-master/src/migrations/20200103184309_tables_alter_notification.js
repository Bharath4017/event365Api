
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('notification',function(table){
        table.renameColumn('senderId','userId');
    })
};

exports.down = function(knex, Promise) {
  
};
