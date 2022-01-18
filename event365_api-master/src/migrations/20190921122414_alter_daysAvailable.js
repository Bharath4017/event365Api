exports.up = function(knex, Promise) {
    return knex.schema.alterTable('daysAvailable',function(table){
        table.dropColumn('dayName');
        table.integer('weekDayName');
    })
};

exports.down = function(knex, Promise) {
  
};
