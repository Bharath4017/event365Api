
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('venue', function(table) {
        table.dropColumn('fullName');
        table.dropColumn('phoneNumber');
        table.string('latitude');
        table.string('longitude');
    }).alterTable('events',function(table){
        table.dropColumn('latitude');
        table.dropColumn('longitude');
        table.dropColumn('eventVenue');
        table.integer('venueId').unsigned().references('id').inTable('venue').onDelete('cascade');
    }).alterTable('users',function(table){
        table.dropColumn('phoneOTP');
    })
  
};

exports.down = function(knex, Promise) {
    return knex.schema
    .dropTable("paidRegularRSVP")
    .dropTable("freeRSVP");
 
};
