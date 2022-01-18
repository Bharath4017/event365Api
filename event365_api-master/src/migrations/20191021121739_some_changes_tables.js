
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('venue', function(table) {
        table.dropColumn('vipTable');
        table.dropColumn('regularSitting');
        table.dropColumn('isGuestContactAllowed');
        table.dropColumn('isActive');
  
    }).alterTable('events',function(table){
        table.dropColumn('deadlineDate');
        table.dropColumn('deadlineTime');
        table.dropColumn('eventAddress');
        table.integer('notRegVenueId').unsigned().references('id').inTable('nonRegisteredVenue').onDelete('cascade');
    }).alterTable('users',function(table){
        table.dropColumn('userLatitude');
        table.dropColumn('userLongitude');
        table.dropColumn('deviceId');
        table.dropColumn('isActive');
    })
  
};

exports.down = function(knex, Promise) {
    return knex.schema
    .dropTable("paidRegularRSVP")
    .dropTable("freeRSVP");
 
};
