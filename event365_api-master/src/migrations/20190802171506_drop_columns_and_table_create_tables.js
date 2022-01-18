
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('category',function(table){
      table.dropColumn('eventId');
  }).alterTable('subCategory',function(table){
      table.dropColumn('eventId');
  }).alterTable('userChooseSubcategory',function(table){
      table.dropColumn('isActive');
  }).createTable('paidRegularRSVP',function(table){
    table.increments('id').primary();
        table.integer('eventId').references('id').inTable('events').onDelete('cascade');
        table.string('vipTicketName');
        table.integer('vipPrice');
        table.integer('vipTicketQuantity');
        table.string('regularTicketName');
        table.integer('regularPrice');
        table.integer('regularTicketQuantity');
  }).table('paidRSVP', function (table) {
    table.dropForeign('eventId', 'paidrsvp_eventid_foreign');
  })
  .then(() => {
    return knex.schema.dropTable('paidRSVP');
  })
};

exports.down = function(knex, Promise) {
  
};
