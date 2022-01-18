exports.up = function(knex, Promise) {
  return knex.schema.createTable('venue',function(table){
    table.increments('id').primary();
    table.string('venueName').notNullable();
    table.string('address').notNullable();
    table.string('websiteURL');
    table.string('vipTable');
    table.string('regularSitting');
    table.boolean('isGuestContactAllowed').defaultTo(true);
  });
};

exports.down = function(knex, Promise) {
  
};

