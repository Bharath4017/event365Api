
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('ticketNumber', function(table) {
      table.text('QRCode').unique().nullable()
  })
};

exports.down = function(knex, Promise) {
  
};
