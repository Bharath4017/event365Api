
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('venue',function(table){
        table.string('imageIds');
        
    })
  
};

exports.down = function(knex, Promise) {
    return knex.schema
    .dropTable("paidRegularRSVP")
    .dropTable("freeRSVP");
 
};
