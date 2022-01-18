
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('userChooseSubcategory',function(table){
        table.boolean('isActive').default(true);
    }).alterTable('freeRSVP',function(table){
        table.boolean('isActive').default(true);
    }).alterTable('paidRSVP',function(table){
        table.boolean('isActiveVIP').default(true);
        table.boolean('isActiveTable').default(true);
    })
  };
  
  exports.down = function(knex, Promise) {
    
  };