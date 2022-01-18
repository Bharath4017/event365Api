
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('payment',function(table){
        table.string('QRkey');  
        table.dropColumn('bookedId');
    })
};

exports.down = function(knex, Promise) {
  
};
