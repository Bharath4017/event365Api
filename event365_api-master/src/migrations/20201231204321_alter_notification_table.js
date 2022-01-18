
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('notification', function(table) {
         table.integer('notificationType').default(0);;
    })
};

exports.down = function(knex, Promise) {
  
};
