
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users',function(table){
        table.string('latitude');
        table.string('longitude');
        table.integer('deviceId');
        table.boolean('isContactVia').defaultTo(true);
    }).alterTable('contactUs',function(table){
        table.boolean('isActive').defaultTo(false);
    })
  
};

exports.down = function(knex, Promise) {
    return knex.schema
    .dropTable("paidRegularRSVP")
    .dropTable("freeRSVP");
 
};
