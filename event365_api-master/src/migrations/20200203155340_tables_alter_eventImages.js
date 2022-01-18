exports.up = function(knex, Promise) {
    return knex.schema.alterTable('galleryImages', function(table) {
       
        table.string('imageIds');
    })
};

exports.down = function(knex, Promise) {

 
};


