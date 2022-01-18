

exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', function(table) {
       // table.renameColumn('countryCode');
        table.string('countryCode').alter();
    })
  
};

exports.down = function(knex, Promise) {

 
};

//table.integer('countryCode');