
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events', function(table){
        table.boolean('isAmountCredit').default(false);
        table.double('totalAmountCredit');
    })
};

exports.down = function(knex, Promise) {
  
};
