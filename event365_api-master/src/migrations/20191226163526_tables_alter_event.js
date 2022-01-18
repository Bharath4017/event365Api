
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('userChooseSubcategory', function(table) {
        table.dropColumn('eventId');
  
    }).alterTable('events',function(table){
        table.dropColumn('startDate');
        table.dropColumn('startTime');
        table.dropColumn('endDate');
        table.dropColumn('endTime');
        table.dropColumn('sellingStartDate');
        table.dropColumn('sellingEndDate');
        table.dropColumn('sellingStartTime');
        table.dropColumn('sellingEndTime');
        table.dropColumn('notRegVenueId')
        table.dropColumn('categoryId')
        table.dropColumn('subCategoryId')
    })
  
};

exports.down = function(knex, Promise) {
    return knex.schema
    .dropTable("vipTicketBooked")
    .dropTable("regularTicketBooked")
    .dropTable("eventUsers")
    .dropTable("nonRegistedVenue")
    .dropTable("freeTicketBooked");
 
};
