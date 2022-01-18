
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('contactUs',function(table){
        table.integer('issueId').unsigned().references('id').inTable('app_content').onDelete('cascade');
        table.dropColumn('issue');

    })
  
};

exports.down = function(knex, Promise) {
    
 
};
