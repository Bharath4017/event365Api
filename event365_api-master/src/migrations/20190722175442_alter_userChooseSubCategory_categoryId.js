
exports.up = function(knex, Promise) {
    return knex.schema.table('userChooseSubcategory', function (table) {
        table.dropForeign('categoryId', 'userchoosesubcategory_categoryid_foreign');
      })
      .then(() => {
        return knex.schema.dropTable('userChooseCategory');
      });
};

exports.down = function(knex, Promise) {
  
};
