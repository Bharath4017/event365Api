
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('category', function(table) {
        table.boolean('isActive').defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    }).alterTable('subCategory',function(table){
        table.boolean('isActive').defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    }).alterTable('userLikes',function(table){
        table.dropColumn('userLikeCount');
        table.dropColumn('userDisLikeCount');
        table.dropColumn('reviewCount');
        table.dropColumn('rating');
        table.dropColumn('updated_by');
        table.dropColumn('created_by');
    })
};

exports.down = function(knex, Promise) {
    
 
};



