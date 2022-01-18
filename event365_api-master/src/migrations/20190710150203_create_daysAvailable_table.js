
exports.up = function(knex, Promise) {
    return knex.schema.createTable('daysAvailable',function(table){
        table.increments('id').primary();
        table.integer('venueId').unsigned().references('id').inTable('venue').onDelete('cascade');
        table.string('dayName');
      });
};

exports.down = function(knex, Promise) {
  
};
