
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('notification',function(table){
        table.renameColumn('userId','senderId');
        table.integer('receiverId');
    })
};

exports.down = function(knex, Promise) {
  
};
