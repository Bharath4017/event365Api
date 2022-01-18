
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('venue',function(table){
        table.string('countryCode').collate('utf8_general_ci');
        table.string('city').collate('utf8_general_ci');
        table.string('state').collate('utf8_general_ci');
    }).alterTable('venueEvents',function(table){
        table.string('countryCode').collate('utf8_general_ci');
        table.string('city').collate('utf8_general_ci');
        table.string('state').collate('utf8_general_ci');
    })
  };
  
  exports.down = function(knex, Promise) {
    
  };
  