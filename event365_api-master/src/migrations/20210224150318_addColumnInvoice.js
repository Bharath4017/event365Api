
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events', function(table) {
        table.string('invoiceNo', 20)
      })
};

exports.down = function(knex, Promise) {
  
};
