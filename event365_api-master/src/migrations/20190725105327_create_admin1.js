
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('venue',function(table){
        
        table.string('fullName');
        table.string('phoneNumber');
        
      });
};

exports.down = function(knex, Promise) {
  

};
