exports.up = function(knex, Promise) {
    return knex.schema.alterTable('events', function(table) {
       
        table.string('imageIds');
    }).alterTable('galleryImages',function(table){
        table.dropColumn('imageIds');
        
    })
};

exports.down = function(knex, Promise) {

 
};


