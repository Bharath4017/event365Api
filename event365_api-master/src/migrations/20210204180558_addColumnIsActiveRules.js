
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('paidEventPrice', function(table) {
      table.string('ruleType',20)
      table.boolean('isActive').defaultTo(true)
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP')).alter();
  })
};
exports.down = function(knex, Promise) {
  
};
